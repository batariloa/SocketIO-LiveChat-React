import React, { useCallback, useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { parseTextToEmoji } from "../util/emoji-parser";
import { FaUserFriends, FaComments } from "react-icons/fa";
import UserList from "./UserList";

function Chat({ socket, username, room }) {
  const message = useRef("");
  const messagesEndRef = useRef(null); // reference to the end of the messages container

  const [showUsers, setShowUsers] = useState(false);
  const [userList, setUserList] = useState([]);

  const [messageList, setMessageList] = useState([]);

  useEffect(() => {
    const joinRequest = { room, username };

    //start listening for user list before joining
    socket.on("users", (users) => {
      console.log("received user list", users);
      setUserList(users);
    });

    socket.on("receive_message", (messageData) => {
      console.log("received.");
      messageData.message = parseTextToEmoji(messageData.message);
      setMessageList((prev) => [...prev, messageData]);
    });

    socket.on("join_error", (error) => {
      setMessageList((prev) => [
        ...prev,
        { type: "error", message: "There was an error joining the room." },
      ]);
    });
    socket.emit("join_room", joinRequest);

    return () => {};
  }, [socket, username, room]);

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
    <div className="border-2 flex flex-col  w-[90%] sm:w-[500px] p-2  h-[500px]  ">
      <div className=" flex justify-between p-1">
        <div>
          {showUsers ? (
            <p>People online: {userList.length}</p>
          ) : (
            <p>Live chat </p>
          )}
        </div>
        {showUsers ? (
          <FaComments
            onClick={() => {
              setShowUsers((prev) => !prev);
            }}
            className="float-right h-full"
            size={25}
          ></FaComments>
        ) : (
          <FaUserFriends
            onClick={() => {
              setShowUsers((prev) => !prev);
            }}
            className="float-right"
            size={25}
          ></FaUserFriends>
        )}
      </div>

      {showUsers && (
        <div className="w-full h-full flex flex-col">
          <UserList
            className="w-full min-h-full flex flex-col mt-5"
            userList={userList}
          ></UserList>
        </div>
      )}
      {!showUsers && (
        <div className="w-full flex flex-grow flex-col mt-2 justify-between ">
          <div className="chat-body  overflow-y-scroll overflow-x-hidden p-3 h-[370px]">
            {messageList.map((msg) => {
              if (msg.type !== "error") {
                return (
                  <div
                    className=" border-2 max-w-full  w-fit px-2 py-1 mt-2 rounded-md  break-words"
                    key={nanoid()}
                  >
                    <div className="text-sm opacity-50 mb-1">{msg.author}</div>
                    <div>
                      <h1>{msg.message}</h1>
                    </div>
                  </div>
                );
              } else
                return (
                  <div
                    className=" border-2 max-w-full  w-fit px-2 py-1 mt-2 rounded-md  break-words"
                    key={nanoid()}
                  >
                    <div>
                      <h1 className="text-red-500">{msg.message}</h1>
                    </div>
                  </div>
                );
            })}
            <div ref={messagesEndRef} />{" "}
            {/* this div will be scrolled into view */}
          </div>
          <div className="w-full  p-1 flex flex-shrink-0 gap-2">
            <input
              className="border-2 w-full rounded-sm p-1"
              type="text"
              placeholder="Message"
              ref={message}
            ></input>
            <button
              className="border-2 w-20  justify-center items-center p-1 hover:scale-110 rounded-md"
              onClick={sendMessage}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
