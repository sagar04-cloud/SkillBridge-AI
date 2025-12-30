import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { AnalysisResult } from "../types";

// Define the schema calls for structured JSON output
// We cast to any to avoid strict TypeScript recursion issues with the Schema type definition
const analysisSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    jobRole: { type: SchemaType.STRING, description: "The target job role analyzed." },
    overallMatchScore: { type: SchemaType.INTEGER, description: "A score from 0 to 100 indicating fit based on skills and experience." },
    summary: { type: SchemaType.STRING, description: "A brief, encouraging executive summary of the candidate's fit (max 3 sentences)." },
    skillsAnalysis: {
      type: SchemaType.ARRAY,
      description: "List of 6-10 key skills required for the role.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          currentLevel: { type: SchemaType.INTEGER, description: "Estimated proficiency 0-100 based on resume evidence." },
          requiredLevel: { type: SchemaType.INTEGER, description: "Industry standard proficiency 0-100 for this role." },
          category: { type: SchemaType.STRING, enum: ["Technical", "Soft Skill", "Tool"] },
          status: { type: SchemaType.STRING, enum: ["Proficient", "Gap", "Missing"] }
        },
        required: ["name", "currentLevel", "requiredLevel", "category", "status"]
      }
    },
    roadmap: {
      type: SchemaType.ARRAY,
      description: "A 4-6 step phased learning path.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          weekRange: { type: SchemaType.STRING, description: "e.g., 'Weeks 1-2'" },
          phaseTitle: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          focusSkills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          resources: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                type: { type: SchemaType.STRING, enum: ["Course", "Article", "Project", "Documentation"] },
                description: { type: SchemaType.STRING },
                url: { type: SchemaType.STRING, description: "A specific, real URL to a high-quality resource if known, or a search query." }
              },
              required: ["title", "type", "description"]
            }
          }
        },
        required: ["weekRange", "phaseTitle", "description", "focusSkills", "resources"]
      }
    },
    recommendedProjects: {
      type: SchemaType.ARRAY,
      description: "2-3 practical portfolio projects.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          difficulty: { type: SchemaType.STRING, enum: ["Beginner", "Intermediate", "Advanced"] }
        },
        required: ["title", "description", "technologies", "difficulty"]
      }
    }
  },
  required: ["jobRole", "overallMatchScore", "summary", "skillsAnalysis", "roadmap", "recommendedProjects"]
};

const cleanJsonOutput = (text: string): string => {
  if (!text) return "{}";

  let cleaned = text.trim();

  // Remove markdown wrapping using regex that matches start and end
  cleaned = cleaned.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "");

  // Find the first '{' and last '}' to strip any preamble/postamble text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Remove potentially harmful control characters (keeping newlines, tabs, etc)
  // This removes non-printable chars that Gemini sometimes inserts
  cleaned = cleaned.replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  return cleaned;
};

// List of models to try in order of preference
// Includes experimental 2.0/2.5 models which seem to be the ones available for this key
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-pro"
];

export const analyzeCareerPath = async (resumeText: string, targetRole: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env.local file.");
  }

  // Initialize client
  const genAI = new GoogleGenerativeAI(apiKey);

  const systemInstruction = `
    You are an expert Career Coach and Technical Recruiter. 
    Your goal is to analyze a candidate's resume against a target job role and provide a strict, data-driven gap analysis.
    
    Rules for Analysis:
    1. **Be Objective**: Do not overestimate skills. If a skill is mentioned but not demonstrated with depth, score it lower (20-40).
    2. **Identify Gaps**: Focus on what is missing for the ${targetRole}. 
    3. **Actionable Roadmap**: Create a learning path that is realistic. Break it down into 4-6 phases.
    4. **Project Based**: Suggest projects that solve real-world problems relevant to the role.
    
    IMPORTANT: You must output ONLY valid JSON.
  `;

  const userPrompt = `
    Target Job Role: ${targetRole}
    
    Candidate Resume:
    "${resumeText.slice(0, 20000)}"
    
    Please generate the career analysis JSON matching EXACTLY this structure:
    {
      "jobRole": "string",
      "overallMatchScore": 0,
      "summary": "string",
      "skillsAnalysis": [
        { "name": "Skill Name", "currentLevel": 0, "requiredLevel": 0, "category": "Technical", "status": "Gap" }
      ],
      "roadmap": [
        { 
          "weekRange": "Weeks 1-2", 
          "phaseTitle": "string", 
          "description": "string", 
          "focusSkills": ["string"],
          "resources": [{ "title": "string", "type": "Course", "description": "string", "url": "string" }]
        }
      ],
      "recommendedProjects": [
        { "title": "string", "description": "string", "technologies": ["string"], "difficulty": "Intermediate" }
      ]
    }
  `;

  let lastError: any = null;

  for (let i = 0; i < MODELS_TO_TRY.length; i++) {
    const modelName = MODELS_TO_TRY[i];
    try {
      console.log(`Attempting analysis with model: ${modelName}`);

      const config: any = {
        temperature: 0.2,
      };

      // Only add schema for models which support it reliably (1.5 and 2.0)
      if (modelName.includes("1.5") || modelName.includes("2.0")) {
        config.responseMimeType = "application/json";
        config.responseSchema = analysisSchema;
      }

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: config,
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const jsonText = response.text();

      console.log(`Model Used: ${modelName}`);
      console.log("Raw AI Response:", jsonText.substring(0, 500) + "..."); // Log first 500 chars

      if (!jsonText) throw new Error("Empty response");

      console.log(`Success with ${modelName}`);
      const cleanedJson = cleanJsonOutput(jsonText);
      console.log("Cleaned JSON:", cleanedJson.substring(0, 500) + "...");

      return JSON.parse(cleanedJson) as AnalysisResult;

    } catch (error: any) {
      console.warn(`Failed with ${modelName}:`, error.message);
      lastError = error;

      // If it's a quota error, we SHOULD try other models if possible (different models sometimes have independent quotas or pools)
      // But if it's the last model, we throw.
      const isQuotaError = error.message?.includes("429") || error.message?.toLowerCase().includes("quota") || error.message?.toLowerCase().includes("resource exhausted");

      if (isQuotaError && i === MODELS_TO_TRY.length - 1) {
        throw new Error("API Quota Exceeded. You have hit the rate limit for your Gemini API key. Please check your billing or try again later.");
      }
    }
  }

  // If we get here, all models failed
  console.error("All models failed. Last error:", lastError);

  if (lastError?.message?.includes("404") || lastError?.message?.includes("not found")) {
    throw new Error("All attempts to connect to Gemini models failed (404). Please ensure your API Key is valid and enables 'Generative Language API'.");
  }

  throw new Error(`Analysis failed: ${lastError?.message || "Unknown error"}`);
};
