import { Anthropic } from '@anthropic-ai/sdk';
import { systemPrompt } from './prompt.js';
import logger from '../../core/config/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const normalizeApiKey = (key = '') =>
  key.trim().replace(/^Bearer\s+/i, '').replace(/^['"]|['"]$/g, '');

const anthropicApiKey = normalizeApiKey(
  process.env.CLAUDE_KEY || process.env.ANTHROPIC_API_KEY || ''
);

const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
  timeout: 120000, // 2 minutes
  defaultHeaders: {
    "anthropic-version": "2023-06-01"
  }
});

const SONNET_MODEL = 'claude-sonnet-4-6';
const HAIKU_MODEL = 'claude-haiku-4-5';

export const MODELS = {
  SONNET: SONNET_MODEL,
  HAIKU: HAIKU_MODEL
};

export class AIJsonError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'AIJsonError';
    this.statusCode = 502;
    this.details = details;
  }
}

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Extracts the first balanced JSON object from messy model text.
 * This avoids the common first-brace/last-brace bug when prose contains
 * multiple objects, examples, or trailing text.
 */
const extractJSON = (text = '') => {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return text.substring(start, i + 1);
      }
    }
  }

  throw new AIJsonError('No complete JSON object found in AI response.', {
    rawText: text.slice(0, 2000)
  });
};

const jsonTool = {
  name: "return_json",
  description: "Return the final answer as a JSON object that exactly follows the user's requested structure.",
  input_schema: {
    type: "object",
    additionalProperties: true
  }
};

const buildJsonTool = (schema) => ({
  ...jsonTool,
  input_schema: schema || jsonTool.input_schema
});

const parseAnthropicErrorPayload = (error) => {
  const statusCode = error?.status || error?.statusCode;
  const message = error?.message || '';
  const jsonStart = message.indexOf('{');

  if (jsonStart === -1) {
    return { statusCode, type: error?.type, message };
  }

  try {
    const payload = JSON.parse(message.slice(jsonStart));
    return {
      statusCode,
      type: payload?.error?.type || error?.type,
      message: payload?.error?.message || message,
      requestId: payload?.request_id
    };
  } catch {
    return { statusCode, type: error?.type, message };
  }
};

const mapAnthropicError = (error) => {
  const payload = parseAnthropicErrorPayload(error);
  const message = payload.message || error?.message || '';
  const isAuthError =
    payload.statusCode === 401 ||
    payload.type === 'authentication_error' ||
    message.includes('invalid x-api-key');

  if (!isAuthError) return null;

  return new AIJsonError('Anthropic API key is invalid. Update ANTHROPIC_API_KEY in the backend .env file.', {
    provider: 'anthropic',
    providerStatusCode: payload.statusCode || 401,
    providerErrorType: payload.type || 'authentication_error',
    providerMessage: message,
    requestId: payload.requestId
  });
};

const getToolInput = (response) => {
  const toolUse = response.content?.find((block) => block.type === 'tool_use' && block.name === jsonTool.name);
  return toolUse?.input || null;
};

const getTextResponse = (response) => {
  return response.content
    ?.filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n')
    .trim() || '';
};

const parseClaudeJSONResponse = (response) => {
  const toolInput = getToolInput(response);
  if (toolInput) {
    if (!isObject(toolInput)) {
      throw new AIJsonError('AI returned JSON, but it was not an object.', {
        stopReason: response.stop_reason
      });
    }
    return toolInput;
  }

  const rawText = getTextResponse(response);
  const jsonString = extractJSON(rawText);
  const parsed = JSON.parse(jsonString);

  if (!isObject(parsed)) {
    throw new AIJsonError('AI returned JSON, but it was not an object.', {
      stopReason: response.stop_reason,
      rawText
    });
  }

  return parsed;
};

const assertValidResult = (result, validator, label) => {
  if (!validator) return;

  const validationResult = validator(result);
  if (validationResult === true || validationResult === undefined) return;

  throw new AIJsonError(
    `AI returned JSON that does not match the expected ${label || 'response'} shape.`,
    {
      validationError:
        typeof validationResult === 'string'
          ? validationResult
          : 'Unexpected response structure',
      resultPreview: JSON.stringify(result).slice(0, 2000)
    }
  );
};

/**
 * Streams text from Claude for real-time delivery.
 */
export const callClaudeStream = async (messages, specificPrompt, temperature = 0.5, maxTokens = 4096, modelSelection = MODELS.SONNET, sharedContext = '') => {
  const defaultMessages = messages && messages.length > 0 ? messages : [];

  const systemBlocks = [
    { type: "text", text: systemPrompt },
  ];

  if (sharedContext) {
    systemBlocks.push({ type: "text", text: "\n\nSHARED CONTEXT:\n" + sharedContext });
  }

  systemBlocks.push({ type: "text", text: "\n\nINSTRUCTIONS:\n" + specificPrompt });

  return anthropic.messages.stream({
    model: modelSelection,
    max_tokens: maxTokens,
    temperature,
    system: systemBlocks,
    messages: [
      ...defaultMessages,
      { role: 'user', content: specificPrompt }
    ],
  });
};

export const callClaudeJSON = async (
  messages,
  specificPrompt,
  temperature = 0.5,
  maxTokens = 4096,
  modelSelection = MODELS.SONNET,
  sharedContext = '',
  options = {}
) => {
  const { schema, validator, label = 'JSON' } = options;
  let lastError = null;

  const createResponse = async (attemptMessages, attemptTemperature, attemptPrompt) => {
    const systemBlocks = [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" }
      }
    ];

    if (sharedContext) {
      systemBlocks.push({
        type: "text",
        text: "\n\nSHARED CONTEXT:\n" + sharedContext,
        cache_control: { type: "ephemeral" }
      });
    }

    systemBlocks.push({
      type: "text",
      text: "\n\nINSTRUCTIONS:\n" + specificPrompt
    });

    return anthropic.messages.create({
      model: modelSelection,
      max_tokens: Math.max(maxTokens, 4096),
      temperature: attemptTemperature,
      system: systemBlocks,
      tools: [buildJsonTool(schema)],
      tool_choice: { type: "tool", name: jsonTool.name },
      messages: [
        ...attemptMessages,
        {
          role: 'user',
          content:
            attemptPrompt +
            "\n\nCRITICAL: Return only by calling the return_json tool. Do not return markdown or plain text."
        }
      ],
    }, {
      headers: {
        "anthropic-beta": "prompt-caching-2024-07-31"
      }
    });
  };

  try {
    const defaultMessages = messages && messages.length > 0 ? messages : [];
    const response = await createResponse(
      defaultMessages,
      temperature,
      "Please perform the following task now:\n\n" + specificPrompt
    );

    const result = parseClaudeJSONResponse(response);
    assertValidResult(result, validator, label);
    return result;

  } catch (error) {
    const providerError = mapAnthropicError(error);
    if (providerError) {
      logger.error("Claude Authentication Error:", providerError.details);
      throw providerError;
    }

    lastError = error;
    logger.error("Claude JSON Error:", {
      error: error.message,
      details: error.details
    });

    // Retry with clean context. Previous assistant JSON can cause the model to
    // repeat an earlier step's object even when a tool is forced.
    try {
      const responseRetry = await createResponse(
        [],
        Math.min(temperature, 0.2),
        "Generate the requested response again from the shared context and instructions.\n\n" +
          specificPrompt
      );

      const result = parseClaudeJSONResponse(responseRetry);
      assertValidResult(result, validator, label);
      return result;

    } catch (retryError) {
      const retryProviderError = mapAnthropicError(retryError);
      if (retryProviderError) {
        logger.error("Claude Authentication Error:", retryProviderError.details);
        throw retryProviderError;
      }

      logger.error("Claude Retry Error:", {
        firstError: lastError?.message,
        retryError: retryError.message,
        details: retryError.details
      });

      throw new AIJsonError("Failed to parse AI response into JSON after retry.", {
        firstError: lastError?.message,
        retryError: retryError.message,
        retryDetails: retryError.details
      });
    }
  }
};
