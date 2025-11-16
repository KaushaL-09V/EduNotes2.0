// // src/services/aiService.js
// import { GoogleGenAI, Type } from "@google/genai";
// import dotenv from "dotenv";
// dotenv.config();

// if (!process.env.GOOGLE_API_KEY) {
//   throw new Error("API_KEY environment variable not set");
// }

// const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// // Base schema for all note styles
// const baseNotesSchema = {
//   type: Type.OBJECT,
//   properties: {
//     summary: {
//       type: Type.STRING,
//       description: 'A concise summary of the entire transcript',
//     },
//     keyPoints: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.STRING,
//       },
//       description: 'List of the most important points',
//     },
//     actionItems: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.STRING,
//       },
//       description: 'Actionable tasks or follow-ups mentioned',
//     },
//     tags: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.STRING,
//       },
//       description: 'Relevant topic tags',
//     },
//   },
//   required: ['summary', 'keyPoints', 'actionItems', 'tags'],
// };

// // Extended schema for detailed notes
// const detailedNotesSchema = {
//   type: Type.OBJECT,
//   properties: {
//     ...baseNotesSchema.properties,
//     sections: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.OBJECT,
//         properties: {
//           heading: { type: Type.STRING },
//           content: { type: Type.STRING },
//         },
//         required: ['heading', 'content'],
//       },
//       description: 'Organized sections with detailed content',
//     },
//     examples: {
//       type: Type.ARRAY,
//       items: {
//         type: Type.STRING,
//       },
//       description: 'Important examples or case studies mentioned',
//     },
//   },
//   required: ['summary', 'keyPoints', 'actionItems', 'tags', 'sections', 'examples'],
// };

// // Prompt templates for different styles
// const PROMPT_TEMPLATES = {
//   concise: (transcript, title) => `
// You are a note-taking assistant. Create CONCISE notes from this video transcript.

// Video Title: ${title}

// Requirements:
// 1. Write a brief 1-2 sentence summary
// 2. Extract 3-5 key points ONLY (the most important takeaways)
// 3. List 1-3 action items if any exist
// 4. Add 3-5 relevant tags
// 5. Keep everything SHORT and to the point

// Transcript:
// ${transcript.substring(0, 10000)}${transcript.length > 10000 ? "...(truncated)" : ""}

// Return ONLY valid JSON matching the required schema.
// `,

//   standard: (transcript, title) => `
// You are a note-taking assistant. Create well-structured notes from this video transcript.

// Video Title: ${title}

// Requirements:
// 1. Write a concise 2-3 sentence summary
// 2. Extract 5-8 key points covering main ideas
// 3. List relevant action items (if applicable)
// 4. Add 5-7 descriptive tags
// 5. Use clear, educational language

// Transcript:
// ${transcript.substring(0, 12000)}${transcript.length > 12000 ? "...(truncated)" : ""}

// Return ONLY valid JSON matching the required schema.
// `,

//   detailed: (transcript, title) => `
// You are an expert note-taking assistant. Create COMPREHENSIVE, DETAILED notes from this video transcript.

// Video Title: ${title}

// Requirements:
// 1. Write a thorough 3-4 sentence summary
// 2. Extract 8-12 detailed key points with context
// 3. Create 3-5 organized sections with detailed explanations:
//    - Each section should have a clear heading
//    - Include detailed content with explanations, definitions, and context
//    - Cover different aspects/topics discussed
// 4. Include important examples, case studies, or illustrations mentioned
// 5. List all relevant action items and recommendations
// 6. Add 7-10 comprehensive tags

// Focus on:
// - Technical details and specific information
// - Definitions and explanations of concepts
// - Step-by-step processes or instructions
// - Important quotes or insights
// - Relationships between ideas

// Transcript:
// ${transcript.substring(0, 15000)}${transcript.length > 15000 ? "...(truncated)" : ""}

// Return ONLY valid JSON matching the required schema.
// `
// };

// /**
//  * Generate structured notes from transcript using Google Gemini
//  * @param {string} transcript - Video transcript
//  * @param {string} title - Video title
//  * @param {string} noteStyle - Style of notes: 'concise', 'standard', or 'detailed'
//  * @returns {object} Structured notes
//  */
// const generateNotes = async (transcript, title = "Video", noteStyle = "standard") => {
//   try {
//     // Validate note style
//     if (!['concise', 'standard', 'detailed'].includes(noteStyle)) {
//       console.warn(`Invalid note style: ${noteStyle}, defaulting to 'standard'`);
//       noteStyle = "standard";
//     }

//     // Select appropriate prompt and schema
//     const prompt = PROMPT_TEMPLATES[noteStyle](transcript, title);
//     const schema = noteStyle === 'detailed' ? detailedNotesSchema : baseNotesSchema;

//     console.log(`Generating ${noteStyle} notes for: ${title}`);

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//       config: {
//         responseMimeType: "application/json",
//         responseSchema: schema,
//       },
//     });

//     const responseText = response.text;

//     console.log("Raw AI response:", responseText?.substring(0, 200) + "...");

//     if (!responseText) {
//       throw new Error("Received an empty response from the API.");
//     }

//     // Parse the JSON response
//     const parsedNotes = JSON.parse(responseText);

//     console.log("Parsed notes structure:", {
//       hasSummary: !!parsedNotes.summary,
//       keyPointsCount: parsedNotes.keyPoints?.length || 0,
//       hasSections: !!parsedNotes.sections,
//       sectionsCount: parsedNotes.sections?.length || 0,
//       hasExamples: !!parsedNotes.examples,
//       examplesCount: parsedNotes.examples?.length || 0,
//       tagsCount: parsedNotes.tags?.length || 0,
//     });

//     // Validate the response structure
//     if (!parsedNotes.summary || !parsedNotes.keyPoints) {
//       throw new Error("Invalid notes structure received from AI");
//     }

//     console.log(`Successfully generated ${noteStyle} notes with ${parsedNotes.keyPoints.length} key points`);

//     return parsedNotes;

//   } catch (error) {
//     console.error("Error generating notes:", error);
//     throw new Error(`Failed to generate notes: ${error.message}`);
//   }
// };

// /**
//  * Generate full text content from structured notes
//  * @param {object} structuredNotes - Structured notes object
//  * @returns {string} Full content text
//  */
// const generateFullContent = (structuredNotes) => {
//   let content = `# Summary\n\n${structuredNotes.summary}\n\n`;

//   content += `# Key Points\n\n`;
//   structuredNotes.keyPoints.forEach((point, index) => {
//     content += `${index + 1}. ${point}\n`;
//   });

//   // Add sections if they exist (detailed notes)
//   if (structuredNotes.sections && structuredNotes.sections.length > 0) {
//     content += `\n# Detailed Notes\n\n`;
//     structuredNotes.sections.forEach((section) => {
//       content += `## ${section.heading}\n\n${section.content}\n\n`;
//     });
//   }

//   // Add examples if they exist (detailed notes)
//   if (structuredNotes.examples && structuredNotes.examples.length > 0) {
//     content += `\n# Examples\n\n`;
//     structuredNotes.examples.forEach((example, index) => {
//       content += `${index + 1}. ${example}\n`;
//     });
//   }

//   // Add action items if they exist
//   if (structuredNotes.actionItems && structuredNotes.actionItems.length > 0) {
//     content += `\n# Action Items\n\n`;
//     structuredNotes.actionItems.forEach((item, index) => {
//       content += `${index + 1}. ${item}\n`;
//     });
//   }

//   return content;
// };

// /**
//  * Summarize text for quick preview using Gemini
//  * @param {string} text - Text to summarize
//  * @param {number} maxLength - Maximum summary length
//  * @returns {string} Summary
//  */
// const quickSummarize = async (text, maxLength = 200) => {
//   try {
//     const prompt = `
// Summarize the following text in one concise sentence (max ${maxLength} characters):
// ${text.substring(0, 3000)}
// `;

//     const result = await ai.models.generateContent({
//       model: "gemini-2.5-flash",
//       contents: prompt,
//     });

//     return result.text.trim();
//   } catch (error) {
//     console.error("Google AI Summary Error:", error.message);
//     throw new Error(`Failed to generate summary: ${error.message}`);
//   }
// };

// export default {
//   generateNotes,
//   quickSummarize,
//   generateFullContent,
// };


// src/services/aiService.js
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Base schema for all note styles
const baseNotesSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: 'A concise summary of the entire transcript',
    },
    keyPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'List of the most important points',
    },
    actionItems: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Actionable tasks or follow-ups mentioned',
    },
    tags: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Relevant topic tags',
    },
  },
  required: ['summary', 'keyPoints', 'actionItems', 'tags'],
};

// Extended schema for detailed notes
const detailedNotesSchema = {
  type: Type.OBJECT,
  properties: {
    ...baseNotesSchema.properties,
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          content: { type: Type.STRING },
        },
        required: ['heading', 'content'],
      },
      description: 'Organized sections with detailed content',
    },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'Important examples or case studies mentioned',
    },
  },
  required: ['summary', 'keyPoints', 'actionItems', 'tags', 'sections', 'examples'],
};

// Enhanced Prompt templates for different styles
const PROMPT_TEMPLATES = {
  concise: (transcript, title) => `
You are an expert educator creating concise, easy-to-revise study notes from a YouTube video transcript.

📌 Video Title: ${title}

🎯 YOUR TASK:
Convert this transcript into SHORT, focused study notes that a student can quickly review before an exam.

📋 REQUIREMENTS:

1. SUMMARY (1-2 sentences):
   - What is this video about?
   - Why is it important?

2. KEY POINTS (3-5 most important takeaways):
   - Extract ONLY the critical concepts
   - Use simple, clear language
   - Format as bullet points
   - Explain technical terms briefly

3. ACTION ITEMS (1-3 items):
   - What should the viewer do after watching?
   - Any practice exercises or next steps mentioned?
   - Skip this if no actions are suggested

4. TAGS (3-5 keywords):
   - Main topics covered
   - Relevant keywords for searching

✅ STYLE GUIDELINES:
- Write in English
- Explain like teaching a beginner
- Keep it SHORT and FOCUSED
- Use simple words for complex concepts
- Prioritize clarity over completeness

📄 TRANSCRIPT:
${transcript.substring(0, 10000)}${transcript.length > 10000 ? "...(truncated)" : ""}

Return ONLY valid JSON matching the required schema. No additional text or markdown.
`,

  standard: (transcript, title) => `
You are an expert educator creating well-structured study notes from a YouTube video transcript.

📌 Video Title: ${title}

🎯 YOUR TASK:
Convert this transcript into comprehensive study notes that follow the video's flow and are easy to revise.

📋 REQUIREMENTS:

1. SUMMARY (2-3 sentences):
   - What is this video about?
   - Why is this topic important?
   - What will the learner understand after reading?

2. KEY POINTS (5-8 main concepts):
   - Cover all major topics discussed
   - Use bullet format with clear explanations
   - Define technical terms in simple language
   - Add short examples or analogies where helpful
   - Highlight important keywords naturally in the text
   - Follow the video's logical flow

3. ACTION ITEMS (if applicable):
   - Steps to practice or implement
   - Recommendations mentioned
   - Further learning suggestions
   - Skip if no actions are discussed

4. TAGS (5-7 descriptive keywords):
   - Main topics and subtopics
   - Key concepts covered
   - Relevant subject areas

✅ FORMATTING STYLE:
- Write in English
- Explain technical concepts like teaching a beginner
- Use short sentences for clarity
- Include mini-examples in explanations
- Make it revision-friendly
- Balance completeness with readability

📄 TRANSCRIPT:
${transcript.substring(0, 12000)}${transcript.length > 12000 ? "...(truncated)" : ""}

Return ONLY valid JSON matching the required schema. No additional text or markdown.
`,

  detailed: (transcript, title) => `
You are an expert educator creating comprehensive, textbook-quality study notes from a YouTube video transcript.

📌 Video Title: ${title}

🎯 YOUR TASK:
Convert this transcript into COMPLETE, STRUCTURED study notes that cover every important concept with clarity and depth.

📋 REQUIREMENTS:

1. SUMMARY (3-4 sentences):
   - What is this video about?
   - Why is this topic important or relevant?
   - What key knowledge will the learner gain?
   - How does this fit into the broader subject?

2. KEY POINTS (8-12 comprehensive points):
   - Cover ALL major concepts and subtopics
   - Provide context and explanations
   - Define technical terms in simple words
   - Include relevant examples or analogies
   - Highlight relationships between concepts
   - Follow the video's natural structure

3. DETAILED SECTIONS (3-6 organized sections):
   Each section should have:
   - A clear, descriptive heading
   - Comprehensive content covering a specific topic/subtopic
   - Step-by-step processes if procedures are explained
   - Definitions with explanations for key terms
   - Comparisons or contrasts where applicable
   - Mini-examples or scenarios to illustrate concepts
   - Use bullet points and numbering for clarity

   Organize sections by:
   - Main topics or themes
   - Logical progression of ideas
   - Different aspects of the subject
   - Processes, concepts, applications, etc.

4. EXAMPLES (important illustrations):
   - Real-world examples mentioned
   - Case studies or scenarios
   - Analogies that explain concepts
   - Practical applications
   - Before/after comparisons

5. ACTION ITEMS (comprehensive list):
   - All recommendations from the video
   - Practice exercises or assignments
   - Implementation steps
   - Further learning resources mentioned
   - Tips for application

6. TAGS (7-10 comprehensive keywords):
   - All major topics and subtopics
   - Technical terms covered
   - Related concepts
   - Subject area keywords

✅ FORMATTING & STYLE GUIDELINES:
- Write in English
- Explain like teaching a complete beginner
- Break complex ideas into simple components
- Use analogies and real-world examples
- Format for easy revision:
  * Bullet points for details
  * Numbered lists for steps/processes
  * Clear hierarchical structure
  * Naturally emphasize keywords in context
- Ensure COMPLETE coverage - don't skip important points
- Make comparisons clear (use contrast lists)
- Provide step-by-step instructions for any processes

🎓 EDUCATIONAL FOCUS:
- Clarity over complexity
- Practical understanding over memorization
- Logical flow that aids learning
- Revision-friendly structure
- Complete topic coverage

📄 TRANSCRIPT:
${transcript.substring(0, 15000)}${transcript.length > 15000 ? "...(truncated)" : ""}

Return ONLY valid JSON matching the required schema. No additional text or markdown.
`
};

/**
 * Generate structured notes from transcript using Google Gemini
 * @param {string} transcript - Video transcript
 * @param {string} title - Video title
 * @param {string} noteStyle - Style of notes: 'concise', 'standard', or 'detailed'
 * @returns {object} Structured notes
 */
const generateNotes = async (transcript, title = "Video", noteStyle = "standard") => {
  try {
    // Validate note style
    if (!['concise', 'standard', 'detailed'].includes(noteStyle)) {
      console.warn(`Invalid note style: ${noteStyle}, defaulting to 'standard'`);
      noteStyle = "standard";
    }

    // Select appropriate prompt and schema
    const prompt = PROMPT_TEMPLATES[noteStyle](transcript, title);
    const schema = noteStyle === 'detailed' ? detailedNotesSchema : baseNotesSchema;

    console.log(`Generating ${noteStyle} notes for: ${title}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const responseText = response.text;

    console.log("Raw AI response:", responseText?.substring(0, 200) + "...");

    if (!responseText) {
      throw new Error("Received an empty response from the API.");
    }

    // Parse the JSON response
    const parsedNotes = JSON.parse(responseText);

    console.log("Parsed notes structure:", {
      hasSummary: !!parsedNotes.summary,
      keyPointsCount: parsedNotes.keyPoints?.length || 0,
      hasSections: !!parsedNotes.sections,
      sectionsCount: parsedNotes.sections?.length || 0,
      hasExamples: !!parsedNotes.examples,
      examplesCount: parsedNotes.examples?.length || 0,
      tagsCount: parsedNotes.tags?.length || 0,
    });

    // Validate the response structure
    if (!parsedNotes.summary || !parsedNotes.keyPoints) {
      throw new Error("Invalid notes structure received from AI");
    }

    console.log(`Successfully generated ${noteStyle} notes with ${parsedNotes.keyPoints.length} key points`);

    return parsedNotes;

  } catch (error) {
    console.error("Error generating notes:", error);
    throw new Error(`Failed to generate notes: ${error.message}`);
  }
};

/**
 * Generate full text content from structured notes
 * @param {object} structuredNotes - Structured notes object
 * @returns {string} Full content text
 */
const generateFullContent = (structuredNotes) => {
  let content = `# Summary\n\n${structuredNotes.summary}\n\n`;

  content += `# Key Points\n\n`;
  structuredNotes.keyPoints.forEach((point, index) => {
    content += `${index + 1}. ${point}\n`;
  });

  // Add sections if they exist (detailed notes)
  if (structuredNotes.sections && structuredNotes.sections.length > 0) {
    content += `\n# Detailed Notes\n\n`;
    structuredNotes.sections.forEach((section) => {
      content += `## ${section.heading}\n\n${section.content}\n\n`;
    });
  }

  // Add examples if they exist (detailed notes)
  if (structuredNotes.examples && structuredNotes.examples.length > 0) {
    content += `\n# Examples\n\n`;
    structuredNotes.examples.forEach((example, index) => {
      content += `${index + 1}. ${example}\n`;
    });
  }

  // Add action items if they exist
  if (structuredNotes.actionItems && structuredNotes.actionItems.length > 0) {
    content += `\n# Action Items\n\n`;
    structuredNotes.actionItems.forEach((item, index) => {
      content += `${index + 1}. ${item}\n`;
    });
  }

  return content;
};

/**
 * Summarize text for quick preview using Gemini
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Maximum summary length
 * @returns {string} Summary
 */
const quickSummarize = async (text, maxLength = 200) => {
  try {
    const prompt = `
Summarize the following text in one concise sentence (max ${maxLength} characters):
${text.substring(0, 3000)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return result.text.trim();
  } catch (error) {
    console.error("Google AI Summary Error:", error.message);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
};

export default {
  generateNotes,
  quickSummarize,
  generateFullContent,
};