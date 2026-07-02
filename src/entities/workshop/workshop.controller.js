import { generatePremiumPDF } from '../../utility/pdfGenerator.js';
import { callClaudeJSON, callClaudeStream, MODELS } from './ai.service.js';
import { cloudinaryUploadBuffer } from '../../lib/cloudinaryUpload.js';
import {
  checkCreditsAvailable,
  deductCreditsAfterSuccess
} from '../../core/middlewares/creditMiddleware.js';
import WorkshopAnalysis from './workshopAnalysis.model.js';
import { v4 as uuidv4 } from 'uuid';
import subscriptionService from '../subscription/subscription.service.js';
import Invite from '../Invite/Invite.model.js';

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const hasString = (value, key) =>
  typeof value?.[key] === 'string' && value[key].trim().length > 0;

const classificationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['predetermined', 'uncertainties'],
  properties: {
    predetermined: {
      type: 'array',
      items: {
        anyOf: [
          { type: 'string' },
          { type: 'object', additionalProperties: true }
        ]
      }
    },
    uncertainties: {
      type: 'array',
      items: {
        anyOf: [
          { type: 'string' },
          { type: 'object', additionalProperties: true }
        ]
      }
    }
  }
};

const axesSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['axisA', 'axisB', 'scenarios'],
  properties: {
    axisA: {
      type: 'object',
      additionalProperties: false,
      required: ['label', 'selectedForce', 'poleA1', 'poleA2', 'reason'],
      properties: {
        label: { type: 'string' },
        selectedForce: { type: 'string' },
        poleA1: { type: 'string' },
        poleA2: { type: 'string' },
        reason: { type: 'string' }
      }
    },
    axisB: {
      type: 'object',
      additionalProperties: false,
      required: ['label', 'selectedForce', 'poleB1', 'poleB2', 'reason'],
      properties: {
        label: { type: 'string' },
        selectedForce: { type: 'string' },
        poleB1: { type: 'string' },
        poleB2: { type: 'string' },
        reason: { type: 'string' }
      }
    },
    scenarios: {
      type: 'object',
      additionalProperties: false,
      required: ['topRight', 'topLeft', 'bottomLeft', 'bottomRight'],
      properties: {
        topRight: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'summary'],
          properties: { name: { type: 'string' }, summary: { type: 'string' } }
        },
        topLeft: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'summary'],
          properties: { name: { type: 'string' }, summary: { type: 'string' } }
        },
        bottomLeft: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'summary'],
          properties: { name: { type: 'string' }, summary: { type: 'string' } }
        },
        bottomRight: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'summary'],
          properties: { name: { type: 'string' }, summary: { type: 'string' } }
        }
      }
    }
  }
};

const scenarioSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'story', 'implications', 'signposts'],
  properties: {
    name: { type: 'string' },
    story: { type: 'string' },
    implications: { type: 'string' },
    signposts: {
      type: 'array',
      items: { type: 'string' }
    }
  }
};

const windTunnelCellSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['rating', 'reasoning'],
  properties: {
    rating: { type: 'string' },
    reasoning: { type: 'string' }
  }
};

const windTunnelSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'windTunnel',
    'robustMoves',
    'strategicConclusion',
    'recommendedOption'
  ],
  properties: {
    generatedOptions: {
      type: 'array',
      items: { type: 'string' }
    },
    windTunnel: {
      type: 'array',
      items: {
        type: 'array',
        items: windTunnelCellSchema
      }
    },
    robustMoves: {
      type: 'object',
      additionalProperties: false,
      required: ['noRegret', 'keepOpen', 'defer'],
      properties: {
        noRegret: { type: 'array', items: { type: 'string' } },
        keepOpen: { type: 'array', items: { type: 'string' } },
        defer: { type: 'array', items: { type: 'string' } }
      }
    },
    strategicConclusion: { type: 'string' },
    recommendedOption: { type: 'string' }
  }
};

const validateClassification = (result) => {
  if (!isObject(result)) return 'Response must be an object.';
  if (!Array.isArray(result.predetermined))
    return 'Missing predetermined array.';
  if (!Array.isArray(result.uncertainties))
    return 'Missing uncertainties array.';
  return true;
};

const validateAxes = (result) => {
  if (!isObject(result)) return 'Response must be an object.';

  const hasAxisA =
    isObject(result.axisA) &&
    hasString(result.axisA, 'label') &&
    hasString(result.axisA, 'selectedForce') &&
    hasString(result.axisA, 'poleA1') &&
    hasString(result.axisA, 'poleA2');

  const hasAxisB =
    isObject(result.axisB) &&
    hasString(result.axisB, 'label') &&
    hasString(result.axisB, 'selectedForce') &&
    hasString(result.axisB, 'poleB1') &&
    hasString(result.axisB, 'poleB2');

  if (!hasAxisA) return 'Missing complete axisA object.';
  if (!hasAxisB) return 'Missing complete axisB object.';

  const scenarioKeys = ['topRight', 'topLeft', 'bottomLeft', 'bottomRight'];
  if (!isObject(result.scenarios)) return 'Missing scenarios object.';
  for (const key of scenarioKeys) {
    if (!isObject(result.scenarios[key])) return `Missing ${key} scenario.`;
    if (!hasString(result.scenarios[key], 'name'))
      return `Missing ${key}.name.`;
    if (!hasString(result.scenarios[key], 'summary'))
      return `Missing ${key}.summary.`;
  }

  return true;
};

const validateScenario = (result) => {
  if (!isObject(result)) return 'Response must be an object.';
  if (!hasString(result, 'name')) return 'Missing scenario name.';
  if (!hasString(result, 'story')) return 'Missing scenario story.';
  if (!hasString(result, 'implications'))
    return 'Missing scenario implications.';
  if (!Array.isArray(result.signposts)) return 'Missing signposts array.';
  return true;
};

const validateWindTunnel = (result) => {
  if (!isObject(result)) return 'Response must be an object.';
  if (!Array.isArray(result.windTunnel)) return 'Missing windTunnel array.';
  if (!isObject(result.robustMoves)) return 'Missing robustMoves object.';
  if (!Array.isArray(result.robustMoves.noRegret))
    return 'Missing robustMoves.noRegret array.';
  if (!Array.isArray(result.robustMoves.keepOpen))
    return 'Missing robustMoves.keepOpen array.';
  if (!Array.isArray(result.robustMoves.defer))
    return 'Missing robustMoves.defer array.';
  if (!hasString(result, 'strategicConclusion'))
    return 'Missing strategicConclusion.';
  if (!hasString(result, 'recommendedOption'))
    return 'Missing recommendedOption.';
  return true;
};

// STEP 1: Classify Forces (COSTS 1 CREDIT)
export const classifyForces = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const {
      sessionId: requestedSessionId,
      company,
      forces,
      conversationHistory
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user token'
      });
    }

    let sessionId = requestedSessionId;
    let workshopAnalysis = null;

    if (sessionId) {
      workshopAnalysis = await WorkshopAnalysis.findOne({ sessionId, userId });
      if (!workshopAnalysis) {
        return res.status(404).json({
          success: false,
          message: 'Workshop session not found'
        });
      }

      workshopAnalysis.company = company;
      workshopAnalysis.forces = forces;
      workshopAnalysis.status = 'pending';
      workshopAnalysis.lastError = null;
      workshopAnalysis.failedAt = null;
      workshopAnalysis.lastActivityAt = new Date();
      await workshopAnalysis.save();
    } else {
      sessionId = uuidv4();
      workshopAnalysis = await WorkshopAnalysis.create({
        userId,
        sessionId,
        company,
        forces,
        creditsCost: 1,
        creditsDeducted: false,
        status: 'pending',
        lastError: null
      });
    }

    // Check if user has credits. Retrying a previously charged session should not charge again.
    if (!workshopAnalysis.creditsDeducted) {
      const subscription = await subscriptionService.getSubscription(userId);
      if (subscription.availableCredits < 1) {
        return res.status(402).json({
          success: false,
          message: 'Insufficient credits to start new analysis',
          availableCredits: subscription.availableCredits,
          requiredCredits: 1,
          sessionId
        });
      }
    }

    const sharedContext =
      'Detailed Company context: ' +
      JSON.stringify(company) +
      '\n\n' +
      'All driving forces: ' +
      JSON.stringify(forces);

    const specificPrompt =
      'Focal Strategic Question: ' +
      (company.focalQuestion || 'General strategy') +
      '\n' +
      'Horizon Year: ' +
      (company.horizonYear || '2030') +
      '\n\n' +
      'Task: Comprehensive Classification. Classify EVERY driving force provided in the Shared Context with respect to the Focal Question above.\n' +
      'Categorize them into:\n' +
      '1. Predetermined elements (structural changes almost certain to happen regardless of the future outcome).\n' +
      '2. Critical uncertainties (high impact on the focal question but genuinely unpredictable outcome).\n\n' +
      'Return JSON exactly matching this format: { "predetermined": [], "uncertainties": [] }.\n' +
      'CRITICAL: Do not omit any forces. If a force is provided in the input, it must appear in exactly one of the two categories above.';

    let result;
    try {
      result = await callClaudeJSON(
        conversationHistory,
        specificPrompt,
        0.1,
        4096,
        MODELS.SONNET,
        sharedContext,
        {
          schema: classificationSchema,
          validator: validateClassification,
          label: 'classification'
        }
      );
    } catch (error) {
      workshopAnalysis.status = 'failed';
      workshopAnalysis.lastError = error.message;
      workshopAnalysis.failedAt = new Date();
      workshopAnalysis.lastActivityAt = new Date();
      await workshopAnalysis.save();

      return res.status(502).json({
        success: false,
        message: error.message,
        error: error.message,
        details: error.details,
        sessionId
      });
    }

    // Deduct credit AFTER successful processing
    if (!workshopAnalysis.creditsDeducted) {
      await deductCreditsAfterSuccess(workshopAnalysis._id, userId, 1);
      workshopAnalysis.creditsDeducted = true;
    }

    workshopAnalysis.classification = result;
    workshopAnalysis.status = 'completed';
    workshopAnalysis.lastError = null;
    workshopAnalysis.failedAt = null;
    workshopAnalysis.lastActivityAt = new Date();
    await workshopAnalysis.save();

    // Get updated subscription
    const updatedSubscription =
      await subscriptionService.getSubscription(userId);

    res.status(200).json({
      success: true,
      data: result,
      sessionId: sessionId,
      creditsRemaining: updatedSubscription.availableCredits,
      history: [
        ...(conversationHistory || []),
        { role: 'user', content: 'Classify forces.' },
        { role: 'assistant', content: JSON.stringify(result) }
      ]
    });
  } catch (error) {
    next(error);
  }
};

export const selectAxes = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId, company, classification, conversationHistory } =
      req.body;

    // Get existing workshop
    let workshopAnalysis = await WorkshopAnalysis.findOne({
      sessionId,
      userId
    });
    if (!workshopAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Workshop session not found'
      });
    }

    const sharedContext =
      'Company Context: ' +
      JSON.stringify(company) +
      '\n\n' +
      'Critical Uncertainties: ' +
      JSON.stringify(classification.uncertainties);

    const specificPrompt =
      'Task: Select EXACTLY 2 individual critical uncertainties from the Shared Context to become the scenario axes.\n' +
      'Selection Criteria:\n' +
      '1. Highest strategic impact on the focal question.\n' +
      '2. Genuine unpredictability.\n' +
      "3. Independence (uncorrelated — if one moves, the other doesn't necessarily move with it).\n\n" +
      "CRITICAL: Do NOT synthesize or combine multiple forces into a 'theme'. Pick exactly one specific, individual force from the input list for Axis A and one for Axis B.\n\n" +
      'For each axis define 2 polar end labels (extreme opposite outcomes).\n\n' +
      'Also, pre-generate 4 scenario names and 1-sentence summaries for the resulting matrix quadrants:\n' +
      '- topRight (poleA2 + poleB2)\n' +
      '- topLeft (poleA1 + poleB2)\n' +
      '- bottomLeft (poleA1 + poleB1)\n' +
      '- bottomRight (poleA2 + poleB1)\n\n' +
      'Return JSON exactly matching this format:\n' +
      '{\n' +
      '  "axisA": { "label": "concise UI name", "selectedForce": "exact original force string from input", "poleA1": "string", "poleA2": "string", "reason": "string" },\n' +
      '  "axisB": { "label": "concise UI name", "selectedForce": "exact original force string from input", "poleB1": "string", "poleB2": "string", "reason": "string" },\n' +
      '  "scenarios": {\n' +
      '    "topRight": { "name": "string", "summary": "string" },\n' +
      '    "topLeft": { "name": "string", "summary": "string" },\n' +
      '    "bottomLeft": { "name": "string", "summary": "string" },\n' +
      '    "bottomRight": { "name": "string", "summary": "string" }\n' +
      '  }\n' +
      '}';

    const result = await callClaudeJSON(
      conversationHistory,
      specificPrompt,
      0.1,
      3000,
      MODELS.SONNET,
      sharedContext,
      {
        schema: axesSchema,
        validator: validateAxes,
        label: 'axes'
      }
    );

    // Save to workshop
    workshopAnalysis.axes = result;
    workshopAnalysis.lastActivityAt = new Date();
    await workshopAnalysis.save();

    res.status(200).json({
      success: true,
      data: result,
      sessionId,
      history: [
        ...(conversationHistory || []),
        { role: 'user', content: 'Select axes.' },
        { role: 'assistant', content: JSON.stringify(result) }
      ]
    });
  } catch (error) {
    next(error);
  }
};

export const buildScenarios = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId, company, axes, forces, conversationHistory } = req.body;

    // Get existing workshop
    let workshopAnalysis = await WorkshopAnalysis.findOne({
      sessionId,
      userId
    });
    if (!workshopAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Workshop session not found'
      });
    }

    const sharedContext =
      'Detailed Company context: ' +
      JSON.stringify(company) +
      '\n\n' +
      'All driving forces: ' +
      JSON.stringify(forces);

    // Quadrant definitions
    const quadrants = [
      { id: 1, comb: 'A1+B1', pA: axes.axisA.poleA1, pB: axes.axisB.poleB1 },
      { id: 2, comb: 'A1+B2', pA: axes.axisA.poleA1, pB: axes.axisB.poleB2 },
      { id: 3, comb: 'A2+B1', pA: axes.axisA.poleA2, pB: axes.axisB.poleB1 },
      { id: 4, comb: 'A2+B2', pA: axes.axisA.poleA2, pB: axes.axisB.poleB2 }
    ];

    // Helper to generate a single scenario
    const generateScenario = async (q) => {
      const specificPrompt =
        `Build a scenario story where both ${axes.axisA.label} is ${q.pA} AND ${axes.axisB.label} is ${q.pB}.\n` +
        `Focal question: ${company.focalQuestion}\n\n` +
        `Task: Concise Scenario Construction. Generate 1 scenario for this quadrant (${q.comb}).\n` +
        `- Give it a vivid memorable name.\n` +
        `- Write a concise but impactful 1-2 paragraph story of the world in ${company.horizonYear}.\n` +
        `- Explain implications for ${company.name} (exactly 2 concise sentences).\n` +
        `- List 3-4 key early warning signposts.\n\n` +
        `Return JSON exactly matching this format: { "name": "string", "story": "string", "implications": "string", "signposts": ["string"] }`;

      const result = await callClaudeJSON(
        conversationHistory,
        specificPrompt,
        0.7,
        3500,
        MODELS.SONNET,
        sharedContext,
        {
          schema: scenarioSchema,
          validator: validateScenario,
          label: `scenario ${q.comb}`
        }
      );
      return { ...result, id: q.id, combination: q.comb };
    };

    // Process scenarios in batches (2 + 2)
    const batch1 = await Promise.all([
      generateScenario(quadrants[0]),
      generateScenario(quadrants[1])
    ]);
    const batch2 = await Promise.all([
      generateScenario(quadrants[2]),
      generateScenario(quadrants[3])
    ]);

    const finalResult = { scenarios: [...batch1, ...batch2] };

    // Save to workshop
    workshopAnalysis.scenarios = finalResult;
    workshopAnalysis.lastActivityAt = new Date();
    await workshopAnalysis.save();

    res.status(200).json({
      success: true,
      data: finalResult,
      sessionId,
      history: [
        ...(conversationHistory || []),
        { role: 'user', content: 'Build 4 scenarios.' },
        { role: 'assistant', content: JSON.stringify(finalResult) }
      ]
    });
  } catch (error) {
    next(error);
  }
};

export const runWindTunnel = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      sessionId,
      company,
      scenarios,
      strategicOptions,
      conversationHistory
    } = req.body;

    // Get existing workshop
    let workshopAnalysis = await WorkshopAnalysis.findOne({
      sessionId,
      userId
    });
    if (!workshopAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Workshop session not found'
      });
    }

    const hasOptions = strategicOptions && strategicOptions.length > 0;

    const specificPrompt =
      'TASK: WIND TUNNEL ANALYSIS ONLY.\n' +
      'You are evaluating strategic options across predefined scenarios.\n\n' +
      'CRITICAL INSTRUCTIONS:\n' +
      '- DO NOT generate or repeat scenarios\n' +
      '- DO NOT include narratives, opportunities, or threats\n' +
      '- DO NOT return anything except the required JSON\n' +
      '- If you deviate from the format, the response is invalid\n\n' +
      'Company: ' +
      company.name +
      '\n' +
      'Focal Question: ' +
      company.focalQuestion +
      '\n' +
      'Horizon Year: ' +
      company.horizonYear +
      '\n\n' +
      'Scenarios (names only): ' +
      JSON.stringify(scenarios.map((s) => s.name)) +
      '\n\n' +
      (hasOptions
        ? 'Strategic options: ' + JSON.stringify(strategicOptions) + '\n\n'
        : 'TASK: First generate 3 distinct, high-impact strategic options labeled exactly as Option A, Option B, Option C.\n\n') +
      'EVALUATION INSTRUCTIONS:\n' +
      'For EACH combination of (Option × Scenario):\n' +
      '- Provide rating: Excellent | Good | Moderate | Poor\n' +
      '- Provide reasoning: exactly 2 concise sentences\n\n' +
      'Also identify:\n' +
      '- No-regret moves (work across ALL scenarios)\n' +
      '- Options to keep open (hedge bets)\n' +
      '- Decisions to defer (wait for more signals)\n\n' +
      'FINAL OUTPUT FORMAT (STRICT JSON ONLY):\n' +
      '{\n' +
      (hasOptions
        ? ''
        : '  "generatedOptions": ["string", "string", "string"],\n') +
      '  "windTunnel": [\n' +
      '    [ { "rating": "string", "reasoning": "string" } ]\n' +
      '  ],\n' +
      '  "robustMoves": {\n' +
      '    "noRegret": ["string"],\n' +
      '    "keepOpen": ["string"],\n' +
      '    "defer": ["string"]\n' +
      '  },\n' +
      '  "strategicConclusion": "string",\n' +
      '  "recommendedOption": "string"\n' +
      '}';

    const sharedContext =
      'Company: ' +
      JSON.stringify(company) +
      '\n\n' +
      'Scenarios: ' +
      JSON.stringify(scenarios.map((s) => ({ name: s.name, story: s.story })));

    const result = await callClaudeJSON(
      conversationHistory,
      specificPrompt,
      0.2,
      5000,
      MODELS.SONNET,
      sharedContext,
      {
        schema: windTunnelSchema,
        validator: validateWindTunnel,
        label: 'wind tunnel'
      }
    );

    // Save to workshop
    workshopAnalysis.windTunnelResults = result;
    workshopAnalysis.lastActivityAt = new Date();
    await workshopAnalysis.save();

    res.status(200).json({
      success: true,
      data: result,
      sessionId,
      history: [
        ...(conversationHistory || []),
        {
          role: 'user',
          content: hasOptions
            ? 'Run wind tunnel.'
            : 'Generate and test options.'
        },
        { role: 'assistant', content: JSON.stringify(result) }
      ]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * STREAMING Report Generation (No PDF/Cloudinary for now)
 */
export const generateReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId, workshopState } = req.body;
    const { company } = workshopState;

    // Get existing workshop
    let workshopAnalysis = await WorkshopAnalysis.findOne({
      sessionId,
      userId
    });
    if (!workshopAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Workshop session not found'
      });
    }

    const specificPrompt =
      `You are a premium strategy consultant (McKinsey/Shell style).\n` +
      `TASK: Generate a COMPREHENSIVE STRATEGIC REPORT for ${company.name} based on the provided workshop state.\n\n` +
      `FOCAL QUESTION: ${company.focalQuestion}\n` +
      `HORIZON YEAR: ${company.horizonYear}\n\n` +
      `OUTPUT ONLY THE MARKDOWN CONTENT. NO JSON, NO PREAMBLE. USE ## FOR HEADERS.\n\n` +
      '1. Executive Summary\n2. Focal Question\n3. Key Uncertainties\n4. Scenarios\n5. Stress-Test Analysis\n6. Recommendations\n7. Signposts';

    const sharedContext =
      'Full Workshop State to base the report on: ' +
      JSON.stringify(workshopState);

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await callClaudeStream(
      [],
      specificPrompt,
      0.5,
      4000,
      MODELS.SONNET,
      sharedContext
    );

    let fullText = '';
    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        const text = chunk.delta.text;
        fullText += text;
        res.write(text);
      }
    }

    // Save report to workshop
    workshopAnalysis.report = fullText.trim();
    workshopAnalysis.completedAt = new Date();
    await workshopAnalysis.save();

    // Send the final JSON data for logic (HIDDEN FROM UI)
    const finalData = {
      success: true,
      reportMarkdown: fullText.trim(),
      generatedAt: new Date().toISOString(),
      sessionId
    };

    // Using a more distinct marker to prevent UI leaks
    res.write('\n\n###JSON_DATA###' + JSON.stringify(finalData));
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      console.error('Streaming Error:', error);
      res.end();
    }
  }
};

/**
 * FAST PDF Export & Cloud Upload: Converts provided Markdown to PDF and uploads it.
 */
export const downloadPDF = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      sessionId,
      reportMarkdown,
      companyName = 'Strategic Report'
    } = req.body;
    let workshopAnalysis = null;

    if (!reportMarkdown) {
      return res
        .status(400)
        .json({ success: false, message: 'No report content provided.' });
    }

    // Get workshop to verify ownership
    if (sessionId) {
      workshopAnalysis = await WorkshopAnalysis.findOne({ sessionId, userId });
      if (!workshopAnalysis) {
        return res.status(404).json({
          success: false,
          message: 'Workshop session not found'
        });
      }
    }

    // 1. Generate PDF Buffer locally (fast, no Chrome)
    const pdfBuffer = await generatePremiumPDF(reportMarkdown, { companyName });

    // 2. Upload to Cloudinary
    const publicId = `report_${Date.now()}`;
    const folder = 'workshop_reports';

    const uploadResult = await cloudinaryUploadBuffer(
      pdfBuffer,
      publicId,
      folder
    );
    const fileName = `${companyName.replaceAll(' ', '_')}_Strategic_Report.pdf`;

    if (workshopAnalysis) {
      workshopAnalysis.pdfUrl = uploadResult.secure_url;
      workshopAnalysis.pdfFileName = fileName;
      workshopAnalysis.pdfGeneratedAt = new Date();
      await workshopAnalysis.save();
    }

    // 3. Return the secure URL
    res.status(200).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        fileName
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkshopHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { limit = 20 } = req.query;

    const history = await WorkshopAnalysis.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select(
        'sessionId company forces classification axes scenarios windTunnelResults creditsCost creditsDeducted status lastError failedAt report pdfUrl pdfFileName pdfGeneratedAt startedAt completedAt lastActivityAt createdAt updatedAt'
      );

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkshopBySession = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const workshopAnalysis = await WorkshopAnalysis.findOne({
      sessionId,
      userId
    });

    if (!workshopAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Workshop session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workshopAnalysis
    });
  } catch (error) {
    next(error);
  }
};

export const addedByInvitedUser = async (req, res, next) => {
  try {
    const { token } = req.params;
    console.log(token);
    const { factor } = req.body;
    console.log(factor);

    if (!factor) {
      throw new Error('Factor is required.');
    }

    // Find invite
    const invite = await Invite.findOne({ token });

    if (!invite) {
      throw new Error('Invalid invitation link.');
    }

    // Find workshop
    const workshop = await WorkshopAnalysis.findById(invite.workshopAnalysisId);

    if (!workshop) {
      throw new Error('Workshop analysis not found.');
    }

    // Push object matching schema
    workshop.guestAdd.push({
      inviteId: invite._id,
      forces: [factor]
    });

    await workshop.save();

    return res.status(200).json({
      success: true,
      message: 'Moving factor added successfully.',
      data: workshop.guestAdd
    });
  } catch (error) {
    next(error);
  }
};
