
import { GoogleGenAI, Type } from "@google/genai";
import { GameTurnResponse, VitalsCondition, VisualState } from "../types";
import { SYSTEM_INSTRUCTION, CALLIE_SCENARIO_PROMPT } from "../constants";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

const gameTurnSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "The scenario description. Brief and concise updates.",
    },
    feedback: {
      type: Type.STRING,
      description: "Feedback on the previous Bowtie selection. Explain pathophysiology.",
    },
    question: {
      type: Type.STRING,
      description: "The prompt text, e.g., 'Complete the diagram based on the current assessment.'",
    },
    vitalSigns: {
      type: Type.OBJECT,
      properties: {
        heartRate: { type: Type.INTEGER },
        bpSystolic: { type: Type.INTEGER },
        bpDiastolic: { type: Type.INTEGER },
        spo2: { type: Type.INTEGER },
        respRate: { type: Type.INTEGER },
        temperature: { type: Type.NUMBER },
        condition: { 
            type: Type.STRING, 
            enum: [VitalsCondition.STABLE, VitalsCondition.DETERIORATING, VitalsCondition.CRITICAL, VitalsCondition.FLATLINE] 
        },
      },
      required: ["heartRate", "bpSystolic", "bpDiastolic", "spo2", "respRate", "temperature", "condition"],
    },
    visualState: {
        type: Type.STRING,
        enum: [VisualState.NORMAL, VisualState.PALE, VisualState.FLUSHED, VisualState.CYANOTIC, VisualState.SWEATING, VisualState.UNCONSCIOUS],
        description: "The visual appearance of the patient."
    },
    bowtie: {
      type: Type.OBJECT,
      description: "NGN Bowtie Clinical Judgment Options.",
      properties: {
        potentialConditions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of 4 potential medical conditions (Center of Bowtie).",
        },
        potentialActions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of 5 potential interventions (Left of Bowtie).",
        },
        potentialMonitoring: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of 5 potential parameters to monitor (Right of Bowtie).",
        }
      },
      required: ["potentialConditions", "potentialActions", "potentialMonitoring"],
      nullable: true
    },
    patientHealth: {
      type: Type.INTEGER,
      description: "0-100 scale.",
    },
    isGameOver: {
      type: Type.BOOLEAN,
    },
    isVictory: {
      type: Type.BOOLEAN,
    },
    learningReport: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Takeaways required when game ends.",
        nullable: true
    }
  },
  required: ["narrative", "feedback", "question", "vitalSigns", "visualState", "patientHealth", "isGameOver", "isVictory"],
};

let chatSession: any = null;

export const startGame = async (mode: 'random' | 'class' | 'upload' = 'random', inputPayload?: string): Promise<GameTurnResponse> => {
  const ai = getAiClient();
  
  chatSession = ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: gameTurnSchema,
      thinkingConfig: { thinkingBudget: 1024 },
    },
  });

  let messageContent: any;

  if (mode === 'class') {
    messageContent = `START SIMULATION. ${CALLIE_SCENARIO_PROMPT}. Present the first Bowtie Challenge immediately.`;
  } else if (mode === 'upload' && inputPayload) {
    // inputPayload is base64 pdf data
    messageContent = [
        {
            inlineData: {
                mimeType: 'application/pdf',
                data: inputPayload
            }
        },
        {
            text: "Analyze this uploaded lesson plan/document. Extract the key learning objectives, pathophysiology, and patient profile. Create a high-fidelity clinical simulation scenario that specifically tests these concepts using the Bowtie Clinical Judgment format. Initialize the patient and start the first assessment immediately."
        }
    ];
  } else {
    // Random mode
    const topicDirective = inputPayload && inputPayload.trim() !== "" 
      ? `The scenario MUST be focused on the topic: "${inputPayload}". Ensure it is a challenging clinical case related to this subject.` 
      : `Generate a random critical care scenario (Sepsis, MI, PE, or Stroke).`;

    messageContent = `Start Simulation. ${topicDirective} Present the first Bowtie Challenge immediately.`;
  }

  const response = await chatSession.sendMessage({ message: messageContent });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text) as GameTurnResponse;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI returned invalid format");
  }
};

export const submitAction = async (userAction: string): Promise<GameTurnResponse> => {
  if (!chatSession) throw new Error("Game not initialized");

  const response = await chatSession.sendMessage({
    message: `User Selection: ${userAction}. Evaluate the clinical judgment. Update patient status based on accuracy. Generate NEXT Bowtie challenge.`,
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    return JSON.parse(text) as GameTurnResponse;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI returned invalid format");
  }
};
