import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _messages } from "@/lib/db/schema";
import { openai } from "@ai-sdk/openai";
import { Message, streamText } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();
  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if (_chats.length != 1) {
    return NextResponse.json({ error: " chat not found" }, { status: 404 });
  }
  const fileKey = _chats[0].fileKey;

  const lastMessage = messages[messages.length - 1];
  const context = await getContext(lastMessage.content, fileKey);

  const prompt = {
    role: "system",
    content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
    The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
    AI is a well-behaved and well-mannered individual.
    AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
    AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
    AI assistant is a big fan of Pinecone and Vercel.
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK
    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
    If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
    AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
    AI assistant will not invent anything that is not drawn directly from the context.
   AI assistant must strictly refuse to answer any question that is not directly supported by the context, including definitions, meanings, or general knowledge not found in the CONTEXT BLOCK.
   If a user asks for definitions, explanations, meanings, or general knowledge not explicitly found in the CONTEXT BLOCK, the AI assistant must strictly respond: "I'm sorry, but I don't know the answer to that question. 
   `,
  };

  await db.insert(_messages).values({
    chatId,
    content: lastMessage.content,
    role: "user",
  });

  const result = streamText({
    model: openai("gpt-4o"),
    messages: [
      prompt,
      ...messages.filter((message: Message) => message.role === "user"),
    ],

    onFinish: async (completion) => {
      await db.insert(_messages).values({
        chatId,
        content: completion.text,
        role: "system",
      });
    },
  });

  return result.toDataStreamResponse({});
}
