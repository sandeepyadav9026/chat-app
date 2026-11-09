import { createContext , useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { toast } from "react-hot-toast";
import { AI_CONTACT, isAiUser, isGroupChat } from "../src/lib/utils.js";





// eslint-disable-next-line react-refresh/only-export-components
export const ChatContext = createContext();

export const ChatProvider = ({children})=>{
     
    const [messages, setMessages] = useState([]);
    const [users,setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [statuses, setStatuses] = useState([]);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [isCreatingStatus, setIsCreatingStatus] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const {socket,axios,authUser } = useContext(AuthContext);
    const selectedUserRef = useRef(selectedUser);
    const messageRequestRef = useRef(0);

    useEffect(() => {
        messageRequestRef.current += 1;
        selectedUserRef.current = null;
        setSelectedUser(null);
        setMessages([]);
        setUsers([]);
        setStatuses([]);
        setUnseenMessages({});
    }, [authUser?._id]);

    useEffect(() => {
        selectedUserRef.current = selectedUser;
    }, [selectedUser]);

    //function to get all users for sidebar
    const getUsers = useCallback(async ()=>{
        try {
            const {data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers([AI_CONTACT, ...(data.users || [])]);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {   
            toast.error(error.message)
        }
    }, [axios]);
    //function to get messages for selected user
    const getMessages = useCallback(async(conversationOrId)=>{
        const requestId = ++messageRequestRef.current;
        setMessages([]);
        try {
            const conversation = typeof conversationOrId === "object" && conversationOrId !== null
                ? conversationOrId
                : selectedUserRef.current;
            const targetId = typeof conversationOrId === "object" && conversationOrId !== null
                ? conversationOrId?._id
                : conversationOrId;

            const endpoint = targetId === AI_CONTACT._id
                ? "/api/ai/messages"
                : isGroupChat(conversation)
                    ? `/api/messages/group/${targetId}`
                    : `/api/messages/${targetId}`;
            const {data} = await axios.get(endpoint);   
            if(data.success && requestId === messageRequestRef.current &&
                String(selectedUserRef.current?._id) === String(targetId)){
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios]);

    //function to send message to selected user
    const sendMessage = async(messageData)=>{
        try {
            const targetConversation = selectedUserRef.current;

            if(!targetConversation?._id){
                toast.error("No recipient selected");
                return;
            }
            setIsSendingMessage(true);
            const endpoint = isAiUser(targetConversation)
                ? "/api/ai/chat"
                : isGroupChat(targetConversation)
                    ? `/api/messages/group/send/${targetConversation._id}`
                    : `/api/messages/send/${targetConversation._id}`;
            const {data} = await axios.post(endpoint,messageData);
            if(data.success){
                const stillViewingSameConversation =
                    String(selectedUserRef.current?._id || "") === String(targetConversation._id || "") &&
                    Boolean(isGroupChat(selectedUserRef.current)) === Boolean(isGroupChat(targetConversation)) &&
                    Boolean(isAiUser(selectedUserRef.current)) === Boolean(isAiUser(targetConversation));

                if (!stillViewingSameConversation) {
                    return;
                }

                if (isAiUser(targetConversation)) {
                    setMessages((prevMessages)=>[...prevMessages,...(data.messages || [])]);
                } else {
                    setMessages((prevMessages)=>[...prevMessages,data.newMessage]);
                }
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsSendingMessage(false);
        }
    }

    const createGroup = async (groupData) => {
        try {
            setIsCreatingGroup(true);
            const { data } = await axios.post("/api/messages/groups", groupData);

            if (data.success) {
                setUsers((prevUsers) => {
                    const existingUsers = (prevUsers || []).filter((entry) => String(entry._id) !== String(data.group._id));
                    return [...existingUsers, data.group];
                });
                setSelectedUser(data.group);
                setMessages([]);
                toast.success("Group created");
                return true;
            }

            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            const endpoint = isAiUser(selectedUser)
                ? `/api/ai/messages/${messageId}`
                : `/api/messages/${messageId}`;
            const { data } = await axios.delete(endpoint);

            if (data.success) {
                setMessages((prevMessages) => prevMessages.filter((message) => message._id !== messageId));
                toast.success("Message deleted");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const getStatuses = useCallback(async () => {
        try {
            const { data } = await axios.get("/api/statuses");
            if (data.success) {
                setStatuses(data.statuses || []);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }, [axios]);

    const createStatus = async (statusData) => {
        try {
            setIsCreatingStatus(true);
            const { data } = await axios.post("/api/statuses", statusData);
            if (data.success) {
                await getStatuses();
                toast.success("Status updated");
                return true;
            }
            toast.error(data.message);
            return false;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setIsCreatingStatus(false);
        }
    };

    const deleteStatus = async (statusId) => {
        try {
            const { data } = await axios.delete(`/api/statuses/${statusId}`);
            if (data.success) {
                setStatuses((prevStatuses) =>
                    prevStatuses
                        .map((entry) => ({
                            ...entry,
                            items: entry.items.filter((item) => item._id !== statusId),
                        }))
                        .filter((entry) => entry.items.length)
                );
                toast.success("Status removed");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    //function to  subscribe to messages for selected user
    useEffect(() => {
        if(!socket) return;

        socket.on("newMessage",(newMessage)=>{
            const senderId = String(newMessage.senderId);
            const currentSelectedUserId = String(selectedUserRef.current?._id || "");
            const currentChatIsGroup = isGroupChat(selectedUserRef.current);

            if(!currentChatIsGroup && currentSelectedUserId && senderId === currentSelectedUserId){
                const messageToAppend = {
                    ...newMessage,
                    senderId,
                    receiverId: String(newMessage.receiverId || ""),
                };
                messageToAppend.seen = true;
                setMessages((prevMessages)=>[...prevMessages,messageToAppend]);
                axios.put(`/api/messages/mark/${newMessage._id}`).catch(() => {
                    toast.error("Unable to mark message as read");
                });
            } else {
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,
                    [senderId]:
                    prevUnseenMessages[senderId]
                    ? prevUnseenMessages[senderId] + 1
                    : 1,
                }));
            }
        });

        socket.on("newGroupMessage", (newMessage) => {
            const groupId = String(newMessage.groupId || "");
            const currentSelectedUserId = String(selectedUserRef.current?._id || "");

            if (currentSelectedUserId && groupId === currentSelectedUserId) {
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            } else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [groupId]:
                    prevUnseenMessages[groupId]
                    ? prevUnseenMessages[groupId] + 1
                    : 1,
                }));
            }
        });

        socket.on("groupCreated", (group) => {
            setUsers((prevUsers) => {
                const exists = (prevUsers || []).some((entry) => String(entry._id) === String(group._id));
                if (exists) return prevUsers;
                return [...(prevUsers || []), group];
            });
        });

        socket.on("messageDeleted", ({ messageId }) => {
            setMessages((prevMessages) => prevMessages.filter((message) => message._id !== messageId));
        });
        return () => {
            socket.off("newMessage");
            socket.off("newGroupMessage");
            socket.off("groupCreated");
            socket.off("messageDeleted");
        };
    }, [socket, axios]);

    

    const value = {
        messages,
        users,
        selectedUser,
        // provide both camelCase and lowercase alias to match existing consumers
        getUsers,
        getusers: getUsers,
        getMessages,
        sendMessage,
        deleteMessage,
        statuses,
        getStatuses,
        createStatus,
        createGroup,
        deleteStatus,
        isCreatingStatus,
        isCreatingGroup,
        isSendingMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}
