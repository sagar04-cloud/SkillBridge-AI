const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

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
    console.error("No API key found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite-preview-02-05",
    "gemini-2.0-flash-lite-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-flash-latest",
    "gemini-pro-latest"
];

async function testModels() {
    for (const modelName of modelsToTest) {
        console.log(`\nTesting ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, respond with just the word 'SUCCESS'.");
            console.log(`✅ SUCCESS with ${modelName}:`, result.response.text().trim());
            // If we found a working model, stop and report it
            return modelName;
        } catch (error) {
            let msg = error.message.split('\n')[0];
            console.log(`❌ FAILED with ${modelName}: ${msg}`);
        }
    }
    return null;
}

testModels().then(workingModel => {
    if (workingModel) {
        console.log(`\n🎉 Found working model: ${workingModel}`);
    } else {
        console.log(`\n💀 NO WORKING MODELS FOUND`);
    }
});
