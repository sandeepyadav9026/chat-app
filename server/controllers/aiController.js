import AiMessage from "../models/AiMessage.js";

const aiSystemPrompt = `
You are Pulse AI, a friendly and practical chat assistant inside a personal messaging app.
Keep replies concise, useful, and conversational.
Avoid saying you are a demo, prototype, or school project.
If the user asks for long-form help, structure the answer clearly.
`;

const buildResponsesInput = (history, userMessage) => {
    const items = [];

    for (const message of history) {
        items.push({
            role: message.role,
            content: [
                {
                    type: "input_text",
                    text: message.text,
                },
            ],
        });
    }

    items.push({
        role: "user",
        content: [
            {
                type: "input_text",
                text: userMessage,
            },
        ],
    });

    return items;
};

const generateAiReply = async (history, userMessage) => {
    if (!process.env.OPENAI_API_KEY) {
        return "Pulse AI is ready in the app, but it still needs an `OPENAI_API_KEY` in `server/.env` before live AI replies can work.";
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-5-nano",
            reasoning: {
                effort: "minimal",
            },
            instructions: aiSystemPrompt.trim(),
            input: buildResponsesInput(history, userMessage),
            text: {
                format: {
                    type: "text",
                },
            },
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "Pulse AI could not respond right now");
    }

    return data.output_text?.trim() || "I’m here. Try asking that in a slightly different way.";
};

export const getAiMessages = async (req, res) => {
    try {
        const messages = await AiMessage.find({ userId: req.user._id }).sort({ createdAt: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const sendAiMessage = async (req, res) => {
    try {
        const text = req.body?.text?.trim();

        if (!text) {
            return res.json({ success: false, message: "Message text is required" });
        }

        const history = await AiMessage.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(12);

        const orderedHistory = history.reverse();

        const userMessage = await AiMessage.create({
            userId: req.user._id,
            role: "user",
            text,
        });

        const assistantReply = await generateAiReply(orderedHistory, text);

        const assistantMessage = await AiMessage.create({
            userId: req.user._id,
            role: "assistant",
            text: assistantReply,
        });

        res.json({
            success: true,
            messages: [userMessage, assistantMessage],
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export const deleteAiMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await AiMessage.findOneAndDelete({
            _id: id,
            userId: req.user._id,
        });

        if (!message) {
            return res.json({ success: false, message: "AI message not found" });
        }

        res.json({ success: true, messageId: id });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
