import { Anthropic } from '@anthropic-ai/sdk';
import { systemPrompt } from './prompt.js';
import logger from '../../core/config/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

/**
 * Robustly extracts JSON from a potentially messy string.
 * Finds the first '{' and the last '}' to isolate a JSON object.
 */
const extractJSON = (text) => {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('No valid JSON object found in response.');
  }

  return text.substring(firstBrace, lastBrace + 1);
};

const jsonTool = {
  name: "return_json",
  description: "Return the final answer as a JSON object that exactly follows the user's requested structure.",
  input_schema: {
    type: "object",
    additionalProperties: true
  }
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

export const callClaudeJSON = async (messages, specificPrompt, temperature = 0.5, maxTokens = 4096, modelSelection = MODELS.SONNET, sharedContext = '') => {
  let rawText = '';
  try {
    const defaultMessages = messages && messages.length > 0 ? messages : [];

    // Construct system blocks for optimal caching
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

    const response = await anthropic.messages.create({
      model: modelSelection,
      max_tokens: maxTokens,
      temperature,
      system: systemBlocks,
      tools: [jsonTool],
      tool_choice: { type: "tool", name: jsonTool.name },
      messages: [
        ...defaultMessages,
        { role: 'user', content: "Please perform the following task now:\n\n" + specificPrompt + "\n\nCRITICAL: Return your final answer by calling the return_json tool." }
      ],
    }, {
      headers: {
        "anthropic-beta": "prompt-caching-2024-07-31"
      }
    });

    const toolInput = getToolInput(response);
    if (toolInput) {
      return toolInput;
    }

    rawText = getTextResponse(response);
    const jsonString = extractJSON(rawText);
    return JSON.parse(jsonString);

  } catch (error) {
    logger.error("Claude JSON Parse Error. Raw Text:", { rawText, error: error.message });

    // basic retry
    try {
      const responseRetry = await anthropic.messages.create({
        model: modelSelection,
        max_tokens: maxTokens,
        temperature: temperature,
        system: systemPrompt,
        tools: [jsonTool],
        tool_choice: { type: "tool", name: jsonTool.name },
        messages: [
          ...(messages || []),
          { role: 'user', content: specificPrompt + "\n\nCRITICAL: Return your final answer by calling the return_json tool only." }
        ],
      });

      const toolInput = getToolInput(responseRetry);
      if (toolInput) {
        return toolInput;
      }

      rawText = getTextResponse(responseRetry);
      const jsonString = extractJSON(rawText);
      return JSON.parse(jsonString);

    } catch (retryError) {
      logger.error("Claude Retry Error. Raw Text:", { rawText, error: retryError.message });
      throw new Error("Failed to parse AI response into JSON after retry.");
    }
  }
};
