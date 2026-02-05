"use client";
import { InterviewDataContext } from "@/context/InterviewDataContext";
import { Loader2Icon, Mic, Phone, Timer } from "lucide-react";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";
import { toast } from "sonner";
import TimerComponent from "./_components/TimerComponent";
import axios from "axios";
import { supabase } from "@/services/supabaseClient";
import { useParams, useRouter } from "next/navigation";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY);

function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
  const [activeUser, setActiveUser] = useState(false);
  const [conversation, setConversation] = useState();
  const { interview_id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState();
  const [callEnd, setCallEnd] = useState(false);
  useEffect(() => {
    interviewInfo && startCall();
  }, [interviewInfo]);

  const startCall = async () => {
    const questionList = (interviewInfo?.interviewData?.questionList ?? [])
      .map((q) => q?.question)
      .filter(Boolean)
      .join(", ");
    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage:
        "Hi " +
        interviewInfo?.userName +
        ", how are you? Ready for your interview on " +
        interviewInfo?.interviewData?.jobPosition,
      transcriber: {
        provider: "deepgram",
        model: "nova-2-conversationalai",
        language: "en-GB",
      },
      voice: {
        provider: "vapi",
        voiceId: "elliot",
      },
      model: {
        provider: "openai",
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content:
              `
  You are an AI voice assistant conducting professional interviews for a UK-based company.
Your job is to ask candidates questions thoughtfully, assess their responses, and create a natural conversation flow similar to how a human interviewer would conduct an interview.
Begin with a friendly introduction that sets a relaxed yet professional tone: 
"Hello! I'm delighted to welcome you to your ${interviewInfo?.interviewData?.jobPosition} interview. Before we dive into technical questions, I'd like to learn a bit more about your background."

Start with these background questions (one at a time):
1. "Could you tell me about your professional background and what led you to apply for this position?"
2. "I understand you ran your own company for several years. What motivated you to seek employment now rather than starting another business venture?"
3. "I notice you're currently in the UK. What drew you to seeking opportunities in Turkey,Ukraine rather than the UK job market?"
4. "If circumstances change in the future, would you consider relocating back to your home country or elsewhere?"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: ` +
              questionList +
              `

              Interview guidance:
- Ask only one question at a time and wait for the candidate's complete response before moving to the next question.
- Listen carefully to the candidate's answers and acknowledge key points before moving on.
- If the candidate struggles, offer supportive hints without giving away the answer. For example: "Perhaps consider approaching this from a different angle? How might [relevant concept] apply here?"
- Provide brief, constructive feedback after answers: "That's a thoughtful approach." or "Interesting perspective. Have you considered [alternative viewpoint]?"
- Maintain a conversational tone with natural transitions like "That's helpful context. Now I'd like to understand..." or "Let's shift gears slightly..."
- Be attentive to the candidate's communication style and adapt accordingly.


If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React
`.trim(),
          },
        ],
      },
    };

    try {
      await vapi.start("79658476-9986-478e-a70c-7236579ffa49");
      setCallEnd(false);
    } catch (err) {
      console.log("VAPI START ERROR:", err);

      // bazı durumlarda err Response gibi gelir:
      if (err instanceof Response) {
        const json = await err.json().catch(() => null);
        console.log("VAPI 400 JSON:", json);
      } else {
        // bazı durumlarda err.response olur
        console.log("VAPI ERR RESPONSE:", err?.response);
      }

      toast("Vapi start failed. Check console for details.");
    }
  };

  const stopInterview = () => {
    vapi.stop();
    console.log("STOP...");
    setCallEnd(true);
    GenerateFeedback();
  };

  // vapi.on("call-start", () => {
  //     console.log("Call has started.");
  //     toast('Call Connected...')
  // });
  // vapi.on("speech-start", () => {
  //     console.log("Assistant speech has started.");
  //     setActiveUser(false);
  // });
  // vapi.on("speech-end", () => {
  //     console.log("Assistant speech has ended.");
  //     setActiveUser(true);
  // });
  // vapi.on("call-end", () => {
  //     console.log("Call has ended.");
  //     toast('Interview Ended... Please Wait...');
  //     GenerateFeedback();
  // });

  // vapi.on("message", (message) => {
  //     console.log(message?.conversation);
  //     setConversation(JSON.stringify(message?.conversation));
  // });

  useEffect(() => {
    const handleMessage = (message) => {
      console.log("Message:", message);
      if (message?.conversation) {
        const convoString = JSON.stringify(message.conversation);
        console.log("Conversation string:", convoString);
        setConversation(convoString);
      }
    };

    vapi.on("message", handleMessage);
    vapi.on("call-start", () => {
      console.log("Call has started.");
      toast("Call Connected...");
    });
    vapi.on("speech-start", () => {
      console.log("Assistant speech has started.");
      setActiveUser(false);
    });
    vapi.on("speech-end", () => {
      console.log("Assistant speech has ended.");
      setActiveUser(true);
    });
    vapi.on("call-end", () => {
      console.log("Call has ended.");
      toast("Interview Ended... Please Wait...");
      GenerateFeedback();
    });

    // Clean up the listener
    return () => {
      vapi.off("message", handleMessage);
      vapi.off("call-start", () => console.log("END"));
      vapi.off("speech-start", () => console.log("END"));
      vapi.off("speech-end", () => console.log("END"));
      vapi.off("call-end", () => console.log("END"));
    };
  }, []);

  const GenerateFeedback = async () => {
    setLoading(true);
    console.log("conversation", conversation);

    if (!conversation) {
      return;
    }
    const result = await axios.post("/api/ai-feedback", {
      conversation: conversation,
    });

    console.log(result?.data);
    const Content = result.data.content;
    const FINAL_CONTENT = Content.replace("```json", "").replace("```", "");
    console.log(FINAL_CONTENT);
    // Save to Database

    const { data, error } = await supabase
      .from("interview_feedback")
      .insert([
        {
          userName: interviewInfo?.userName,
          userEmail: interviewInfo?.userEmail,
          interview_id: interview_id,
          feedback: JSON.parse(FINAL_CONTENT),
          recommended: false,
        },
      ])
      .select();
    console.log(data);
    router.replace("/interview/" + interview_id + "/completed");
    setLoading(false);
  };

  return (
    <div className="p-20 lg:px-48 xl:px-56">
      <h2 className="font-bold text-xl flex justify-between">
        AI Interview Sesstion
        <span className="flex gap-2 items-center">
          <Timer />
          {/* 00:00:00 */}
          <TimerComponent start={true} />
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mt-5">
        <div className="bg-white h-[400px] rounded-lg border flex relative flex-col gap-3 items-center justify-center">
          <div className="relative">
            {!activeUser && (
              <span className="absolute  inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />
            )}
            <Image
              src={"/ai.png"}
              alt="ai"
              width={100}
              height={100}
              className="w-[60px] h-[60px] rounded-full object-cover"
            />
          </div>
          <h2>AI Recruiter</h2>
        </div>
        <div className="bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center justify-center">
          <div className="relative">
            {activeUser && (
              <span className="absolute  inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />
            )}
            <h2 className="text-2xl text-white bg-primary  p-3 rounded-full px-5">
              {interviewInfo?.userName[0]}
            </h2>
          </div>
          <h2>{interviewInfo?.userName}</h2>
        </div>
      </div>

      <div className="flex items-center gap-5 justify-center mt-7">
        <Mic className="h-12 w-12 p-3 bg-gray-500 text-white rounded-full cursor-pointer" />
        {/* <AlertConfirmation stopInterview={() => { stopInterview() }}> */}
        {!loading ? (
          <Phone
            className="h-12 w-12 p-3 bg-red-500 text-white rounded-full cursor-pointer"
            onClick={() => stopInterview()}
          />
        ) : (
          <Loader2Icon className="animate-spin" />
        )}
        {/* </AlertConfirmation> */}
      </div>
      <h2 className="text-sm text-gray-400 text-center mt-5">
        Interview in Progress...
      </h2>
    </div>
  );
}

export default StartInterview;
