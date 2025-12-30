const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

async function main() {
    const envPath = path.resolve(__dirname, '..', '.env.local');
    let apiKey = '';

    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/API_KEY=(.*)/);
        if (match) {
            apiKey = match[1].trim().replace(/^["']|["']$/g, '');
        }
    }

    if (!apiKey) {
        console.error("No API Key found.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        // There isn't a direct "listModels" on the instance in older SDK versions, 
        // but let's try to access the model manager if exposed, or just infer from error.
        // Actually, recent SDKs don't expose listModels easily without the full client.
        // We'll trust the error message from the previous step which SUGGESTED calling ListModels.

        // We can try to hitting the REST endpoint for ListModels manually.
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        console.log("Fetching available models from:", listUrl);

        const response = await fetch(listUrl);
        const data = await response.json();

        if (data.models) {
            console.log("✅ AVAILABLE MODELS:");
            data.models.forEach(m => {
                // Filter for generateContent supported models
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("❌ No models returned. Msg:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

main();
