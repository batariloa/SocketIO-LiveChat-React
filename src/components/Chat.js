import React, { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { parseTextToEmoji } from "../util/emoji-parser";

function Chat({ socket, username, room }) {
  const message = useRef("");
  const messagesEndRef = useRef(null); // reference to the end of the messages container

  const [messageList, setMessageList] = useState([
    { room: "dasd", author: "dad", message: "asdasdsa", time: "14:4" },
    { room: "dasd", author: "dad", message: "asdasdsa", time: "14:4" },
  ]);

  useEffect(() => {
    socket.on("receive_message", (messageData) => {
      messageData.message = parseTextToEmoji(messageData.message);
      setMessageList((prev) => [...prev, messageData]);
    });
    return () => {};
  }, [socket]);

  const sendMessage = useCallback(async () => {
    if (!message.current || !message.current.value) return;

    //generate message
    const messageData = {
      room: room,
      author: username,
      message: message.current.value,
      time:
        new Date(Date.now()).getHours() +
        ":" +
        new Date(Date.now()).getMinutes(),
    };

    //send message to other users
    await socket.emit("send_message", messageData);

    //clear message field
    message.current.value = "";
    //update message list with new message
    messageData.message = parseTextToEmoji(messageData.message);

    setMessageList((prev) => [...prev, messageData]);
  }, [socket, room, username]);

  //enter button sends message
  useEffect(() => {
    const listener = (event) => {
      if (event.code === "Enter") {
        sendMessage();
      }
    };
    window.addEventListener("keydown", listener);
  }, [sendMessage]);

  // scroll to the bottom of the messages container when new messages are added
  useEffect(() => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  return (
    <div className="border-2 flex flex-col  w-[300px] md:w-[500px]   max-w-[1000px] p-3 ">
      <div className="chat-header w-full">
        <p>Live chat</p>
      </div>
      <div className="chat-body flex-col gap-3 flex  mt-5 h-[400px] overflow-y-scroll">
        {messageList.map((msg) => {
          return (
            <div
              className="ml-2 border-2 max-w-full mx-2 w-fit px-2 py-1  rounded-md "
              key={nanoid()}
            >
              <div className="text-sm opacity-50 mb-1">{msg.author}</div>
              <div>
                <h1>{msg.message}</h1>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} /> {/* this div will be scrolled into view */}
      </div>
      <div className="chat-footer w-full mt-5 p-2 flex gap-1">
        <input
          className="border-2 w-full rounded-sm"
          type="text"
          placeholder="Message"
          ref={message}
        ></input>
        <button
          className="border-2 w-20 h-full  flex justify-center items-center p-1 hover:scale-110 rounded-sm"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
