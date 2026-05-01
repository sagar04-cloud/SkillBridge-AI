import { AnalysisResult } from "../types";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
  cleaned = cleaned.replace(/[\u0000-\u0009\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");

  return cleaned;
};

export const analyzeCareerPath = async (resumeText: string, targetRole: string): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your .env.local file.");
  }

  const systemInstruction = `
    You are an expert Career Coach and Technical Recruiter. 
    Your goal is to analyze a candidate's resume against a target job role and provide a strict, data-driven gap analysis.
    
    Rules for Analysis:
    1. **Be Objective**: Do not overestimate skills. If a skill is mentioned but not demonstrated with depth, score it lower (20-40).
    2. **Identify Gaps**: Focus on what is missing for the ${targetRole}. 
    3. **Actionable Roadmap**: Create a learning path that is realistic. Break it down into 4-6 phases.
    4. **Project Based**: Suggest projects that solve real-world problems relevant to the role.
    
    IMPORTANT: You must output ONLY valid JSON matching exactly this structure:
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

  const userPrompt = `
    Target Job Role: ${targetRole}
    
    Candidate Resume:
    "${resumeText.slice(0, 20000)}"
  `;

  // Initialize Google Generative AI
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: systemInstruction
  });

  try {
    console.log("Calling Gemini API with gemini-2.5-flash...");

    const result = await model.generateContent(userPrompt);

    const response = await result.response;
    const jsonText = response.text();

    if (!jsonText) throw new Error("Empty response from Gemini");

    console.log("Success with Gemini API");
    const cleanedJson = cleanJsonOutput(jsonText);
    return JSON.parse(cleanedJson) as AnalysisResult;

  } catch (error: any) {
    console.error("Gemini API error:", error.message);
    throw new Error(`Analysis failed: ${error.message}`);
  }
  
};
