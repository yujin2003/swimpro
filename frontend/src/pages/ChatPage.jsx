import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import TopNav from "../components/TopNav";
import { messagesAPI, handleAPIError } from "../services/api.js";
import { AUTH_CONFIG } from "../config/environment.js";
import { useUser } from "../store/user.jsx";

// 전역으로 user 참조를 위한 변수 (ChatBubble에서 사용)
// 전역 변수 제거 - 각 창이 독립적으로 작동하도록 컴포넌트 내부 상태 사용

// Interactive single-file React app (TailwindCSS assumed)
// Features added:
// - send messages (Enter or send button)
// - auto-scroll to bottom on new message
// - simple auto-reply bot after a short delay
// - localStorage persistence so messages survive reloads

// 초기 대화 데이터 - 빈 객체로 시작 (실제 대화는 API에서 불러옴)
const initialConversations = {};

// JWT 토큰에서 userId 추출 함수 (컴포넌트 외부)
const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    // JWT 형식: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // payload 디코딩 (base64url)
    const payload = parts[1];
    // base64url을 base64로 변환 (padding 추가)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    
    return parsed.userId || parsed.user_id || parsed.id || null;
  } catch (error) {
    console.error('❌ JWT 토큰 디코딩 실패:', error);
    return null;
  }
};

function formatTime(date = new Date()) {
  // simple hh:mm am/pm
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const h = ((hours + 11) % 12) + 1; // 12-hour
  return `${h}:${minutes} ${ampm}`;
}

function LeftMenu() {
  const { user } = useUser();
  
  return (
    <aside className="rounded-2xl bg-white/90 p-6 shadow flex flex-col h-full" style={{ position: 'relative', zIndex: 100 }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl">
          {user?.avatar || '👤'}
        </div>
        <div>
          <div className="font-semibold">{user?.name || user?.username || '게스트'}</div>
          <div className="text-sm text-gray-500">{user?.email || '로그인이 필요합니다'}</div>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        <SideItem icon={<HomeIcon />} label="Home" to="/" />
        <SideItem icon={<MessageIcon />} label="DM" to="/chat" />
      </nav>

      <div className="border-t pt-4 mt-auto">
        <p className="text-[15px] text-gray-700 font-medium leading-relaxed">
          Dive Deeper into<br />
          Your Swimming Journey
        </p>
      </div>
    </aside>
  );
}

function SideItem({ icon, label, to }) {
  const navigate = useNavigate();
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘 SideItem 클릭 (ChatPage):', { label, to });
    
    if (to) {
      try {
        navigate(to);
        console.log('✅ navigate 호출 완료:', to);
      } catch (error) {
        console.error('❌ navigate 실패:', error);
        window.location.href = to;
      }
    } else {
      alert(`${label} 클릭`);
    }
  };
  
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px] hover:bg-gray-100"
      onClick={handleClick}
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        zIndex: 10,
        position: 'relative'
      }}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center text-gray-600">
        {icon}
      </span>
      <span className="text-gray-800">{label}</span>
    </button>
  );
}

function CenterPanel({ conversations, selectedUserId, onSelectUser, loading, newMessageCount, setNewMessageCount }) {
  const conversationList = Object.values(conversations);
  
  // 최근 메시지 시간 기준으로 정렬
  const sortedConversations = conversationList.sort((a, b) => {
    const aLastMsg = a.messages[a.messages.length - 1];
    const bLastMsg = b.messages[b.messages.length - 1];
    if (!aLastMsg && !bLastMsg) return 0;
    if (!aLastMsg) return 1;
    if (!bLastMsg) return -1;
    return new Date(bLastMsg.timestamp).getTime() - new Date(aLastMsg.timestamp).getTime();
  });

  return (
    <div className="w-80 bg-indigo-200/50 rounded-xl p-4 flex flex-col shadow-inner h-[620px]" style={{ position: 'relative', zIndex: 100 }}>
      <h3 className="text-lg font-semibold text-indigo-800 mb-4 px-2">쪽지</h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {loading ? (
          <div className="text-center text-sm text-indigo-600 mt-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
            로딩 중...
      </div>
        ) : sortedConversations.length === 0 ? (
          <div className="text-center text-sm text-indigo-600 mt-10 px-4">
            <div className="text-2xl mb-2">💬</div>
            <div className="font-medium mb-1">아직 대화한 사람이 없습니다.</div>
            <div className="text-xs text-indigo-500 mt-2">
              다른 사용자와 대화를 시작해보세요!
          </div>
        </div>
        ) : (
          sortedConversations.map((conv) => {
            const lastMessage = conv.messages[conv.messages.length - 1];
            const isSelected = selectedUserId === conv.user.id;
            
            return (
              <button
                key={conv.user.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  console.log('🔘 대화 상대 선택:', { userId: conv.user.id, name: conv.user.name });
                  onSelectUser(conv.user.id);
                  // 선택 시 읽음 처리
                  if (newMessageCount[conv.user.id] > 0 && setNewMessageCount) {
                    setNewMessageCount(prev => ({ ...prev, [conv.user.id]: 0 }));
                  }
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-indigo-300/70 text-indigo-900' 
                    : 'hover:bg-indigo-200/50 text-indigo-800'
                }`}
                style={{
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                <div className={`w-12 h-12 rounded-full bg-yellow-300 flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                  isSelected ? 'ring-2 ring-indigo-500' : ''
                }`}>
                  {conv.user.avatar}
          </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium truncate">{conv.user.name}</div>
                  {lastMessage ? (
                    <div className="text-xs text-indigo-600 truncate mt-1">
                      {lastMessage.text}
        </div>
                  ) : (
                    <div className="text-xs text-indigo-500 truncate mt-1">
                      대화 시작하기
          </div>
                  )}
        </div>
                {lastMessage && (
                  <div className="text-xs text-indigo-500 flex-shrink-0">
                    {lastMessage.time}
        </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChatBubble({ msg, otherAvatar, currentUser }) {
  // 단순하게 by 속성만 확인 (loadMessagesWithUser에서 이미 정확히 설정됨)
  const isMe = msg.by === "me";
  
  // 내 메시지와 상대방 메시지를 시각적으로 구분
  const displayAvatar = isMe ? (currentUser?.avatar || 'ME') : otherAvatar;
  
  // 내 메시지: 오른쪽 정렬, 보라색/인디고 배경
  // 상대방 메시지: 왼쪽 정렬, 흰색 배경
  if (isMe) {
    // 내 메시지 (오른쪽 정렬, 보라색 배경)
    return (
      <div className="flex justify-end mb-3 group animate-fadeIn" style={{ direction: 'ltr' }}> 
        <div className="max-w-[70%] p-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md">
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {msg.text}
          </div>
          <div className="text-xs mt-1 text-indigo-100 text-right">
            {msg.time}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center ml-3 text-white font-semibold flex-shrink-0 shadow-md">
          {displayAvatar}
        </div>
      </div>
    );
  } else {
    // 상대방 메시지 (왼쪽 정렬, 흰색 배경)
    return (
      <div className="flex justify-start mb-3 group animate-fadeIn"> 
        <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center mr-3 text-white font-semibold flex-shrink-0 shadow-md">
          {displayAvatar}
        </div>
        <div className="max-w-[70%] p-3 rounded-lg bg-white border-2 border-slate-200 shadow-sm">
          <div className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
            {msg.text}
          </div>
          <div className="text-xs mt-1 text-slate-400 text-left">
            {msg.time}
          </div>
        </div>
    </div>
  );
  }
}

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser(); // 1️⃣ 로그인 유저 정보 (userId, token)
  
  // 전역 변수 제거됨 - 각 창이 독립적으로 작동
  
  const [conversations, setConversations] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const selectedUserIdRef = useRef(null); // 최신 selectedUserId 추적 (WebSocket 핸들러용)
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState({}); // 새로운 메시지 카운트
  
  // selectedUserId가 변경될 때마다 ref 업데이트
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);
  
  // 현재 사용자 ID (localStorage에서 가져오기 - 안전하게)
  // 1. JWT 토큰에서 userId 추출 (최우선)
  // 2. localStorage/sessionStorage에서 userId 가져오기
  // 3. user 객체에서 가져오기
  // 4. 숫자로 변환
  const getCurrentUserId = () => {
    // 1. JWT 토큰에서 userId 추출 (최우선 - 가장 신뢰할 수 있는 소스)
    const token = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (token) {
      const tokenUserId = getUserIdFromToken(token);
      if (tokenUserId) {
        const numericId = Number(tokenUserId);
        if (!isNaN(numericId)) {
          return numericId;
        }
      }
    }
    
    // 2. sessionStorage/localStorage에서 userId 가져오기 (우선순위 2)
    const storedUserId = sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY) || localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
    if (storedUserId) {
      const numericId = Number(storedUserId);
      if (!isNaN(numericId)) {
        return numericId;
      }
    }
    
    // 3. user 객체에서 가져오기 (우선순위 3)
    const userIdFromUser = user?.id || user?.userId || user?.user_id;
    if (userIdFromUser) {
      const numericId = Number(userIdFromUser);
      if (!isNaN(numericId)) {
        return numericId;
      }
    }
    
    console.warn('⚠️ userId를 찾을 수 없습니다. JWT 토큰, localStorage, user 객체 모두 확인됨.');
    return null;
  };
  
  const numericCurrentUserId = getCurrentUserId();
  
  // 디버깅용 로그 (JWT 토큰과 저장된 userId 불일치 확인)
  useEffect(() => {
    const sessionUserId = sessionStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
    const localUserId = localStorage.getItem(AUTH_CONFIG.USER_ID_KEY);
    const token = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    const tokenUserId = token ? getUserIdFromToken(token) : null;
    
    console.log('🔍 ChatPage userId 확인 (최신):', {
      sessionStorage: sessionUserId,
      localStorage: localUserId,
      userObject: user,
      userObjectId: user?.id || user?.userId || user?.user_id,
      tokenUserId: tokenUserId, // ⚠️ JWT 토큰에서 추출한 userId
      numericCurrentUserId: numericCurrentUserId,
      userIdType: typeof numericCurrentUserId,
      userIdNumber: Number(numericCurrentUserId),
      isNumeric: !isNaN(Number(numericCurrentUserId)),
      comparison: `JWT userId: ${tokenUserId}, sessionUserId: ${sessionUserId}, localUserId: ${localUserId}, user.id: ${user?.id}, numericCurrentUserId: ${numericCurrentUserId}`
    });
    
    // ⚠️ 중요: JWT 토큰의 userId와 저장된 userId가 불일치하는 경우 경고
    if (tokenUserId && sessionUserId && Number(tokenUserId) !== Number(sessionUserId)) {
      console.error('❌ CRITICAL: JWT 토큰의 userId와 저장된 userId가 불일치합니다!', {
        tokenUserId: tokenUserId,
        storedUserId: sessionUserId,
        mismatch: `JWT는 ${tokenUserId}번, 저장된 값은 ${sessionUserId}번`,
        recommendation: '로그아웃 후 다시 로그인하세요. JWT 토큰의 userId가 우선됩니다.'
      });
    }
    
    if (!numericCurrentUserId || isNaN(numericCurrentUserId)) {
      console.error('❌ CRITICAL: numericCurrentUserId가 유효하지 않습니다!', {
        numericCurrentUserId,
        tokenUserId,
        sessionUserId,
        localUserId,
        userObject: user
      });
    }
  }, [numericCurrentUserId, user]);

  // WebSocket 연결 초기화 (1단계: 실시간 메시지를 받기 위한 준비)
  const initWebSocket = () => {
    console.log('📡 [1단계] WebSocket 연결 시작...');
    console.log('📡 WebSocket URL: wss://yasuko-bulletless-trudi.ngrok-free.dev/');
    
    // sessionStorage 우선 사용 (각 창 독립적)
    const token = sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
    if (!token) {
      console.error('JWT 토큰이 없습니다. 로그인이 필요합니다.');
      return;
    }

    // WebSocket URL (ngrok 주소 사용)
    const wsUrl = 'wss://yasuko-bulletless-trudi.ngrok-free.dev/';
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공');
        setWsConnected(true);
        
        // 인증 메시지 전송
        const authMessage = {
          type: 'auth',
          token: token
        };
        const authMessageJson = JSON.stringify(authMessage);
        console.log('📤 인증 메시지 전송:', authMessageJson);
        ws.send(authMessageJson);
      };

      // 4️⃣ 실시간 수신 (Socket으로)
      // 상대방이 메시지를 보낼 때 서버에서 전송된 메시지 수신
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket 메시지 수신 (원본):', event.data);
          console.log('📨 WebSocket 메시지 수신 (파싱):', data);

          // 인증 응답 처리
          if (data.type === 'auth' || data.message === '인증에 성공했습니다.') {
            console.log('✅ WebSocket 인증 성공:', data);
            return;
          }
          
          // 4️⃣ 실시간 수신 (Socket으로) - receiveMessage 이벤트
          // WebSocket 서버에서 오는 메시지 타입: 'new_dm' 또는 'dm_sent'
          if ((data.type === 'new_dm' || data.type === 'dm_sent') && data.message) {
            const message = data.message;
            // DB 구조에 맞춰 필드명 확인: sender_id, receiver_id, content, created_at
            const senderId = message.sender_id || message.senderId;
            const receiverId = message.receiver_id || message.receiverId;
            const content = message.content;
            const createdAt = message.created_at || message.timestamp || new Date().toISOString();
            const dmId = message.dm_id || message.id || Date.now();
            
            console.log('📨 수신한 DM 메시지 상세:', {
              type: data.type,
              sender_id: senderId,
              receiver_id: receiverId,
              content: content,
              created_at: createdAt,
              dm_id: dmId
            });
            
            // sender_id와 receiver_id를 숫자로 변환
            const numericSenderId = typeof senderId === 'number' 
              ? senderId 
              : (typeof senderId === 'string' && !isNaN(Number(senderId))) 
                ? Number(senderId) 
                : null;
            const numericReceiverId = typeof receiverId === 'number' 
              ? receiverId 
              : (typeof receiverId === 'string' && !isNaN(Number(receiverId))) 
                ? Number(receiverId) 
                : null;
            
            // 5️⃣ 메시지 렌더링 시 구분: isMe = msg.sender_id === currentUserId
            // ⚠️ 중요: 타입을 통일하여 비교 (String으로 변환하여 비교)
            const currentUserIdStr = String(numericCurrentUserId || '');
            const senderIdStr = String(numericSenderId || '');
            const isMe = senderIdStr === currentUserIdStr;
            
            console.log('📨 WebSocket 메시지 수신 - 사용자 비교:', {
              senderId: numericSenderId,
              senderId_type: typeof numericSenderId,
              receiverId: numericReceiverId,
              currentUserId: numericCurrentUserId,
              currentUserId_type: typeof numericCurrentUserId,
              currentUserIdStr: currentUserIdStr,
              senderIdStr: senderIdStr,
              isMe: isMe,
              messageType: data.type,
              comparison: `${senderIdStr} === ${currentUserIdStr}`
            });
            
            // 수신한 메시지를 conversations에 추가
            // 조건: sender_id와 receiver_id가 모두 있고, 현재 사용자가 sender 또는 receiver이거나
            // 선택된 대화 상대(receiver)와 관련된 메시지인 경우 표시
            if (numericSenderId && numericReceiverId && numericCurrentUserId && content) {
              // 현재 사용자가 메시지의 sender 또는 receiver인지 확인 (String으로 비교)
              const isMyMessage = String(numericSenderId) === String(numericCurrentUserId) || 
                                   String(numericReceiverId) === String(numericCurrentUserId);
              
              // 선택된 대화 상대와 관련된 메시지인지 확인 (ref를 사용하여 최신 값 확인)
              const currentSelectedUserId = selectedUserIdRef.current;
              const selectedUserIdStr = currentSelectedUserId ? String(currentSelectedUserId) : null;
              const isSelectedConversationMessage = selectedUserIdStr && (
                String(numericReceiverId) === selectedUserIdStr || 
                String(numericSenderId) === selectedUserIdStr
              );
              
              // 현재 사용자와 관련 없고, 선택된 대화와도 관련 없으면 스킵
              if (!isMyMessage && !isSelectedConversationMessage) {
                console.log('⚠️ 현재 사용자와 관련 없는 메시지, 스킵:', {
                  senderId: numericSenderId,
                  receiverId: numericReceiverId,
                  currentUserId: numericCurrentUserId,
                  selectedUserId: selectedUserIdStr,
                  selectedUserIdRef: currentSelectedUserId,
                  isSelectedConversation: isSelectedConversationMessage
                });
                return;
              }
              
              // sender_id가 현재 사용자면 receiver_id가 상대방, 그렇지 않으면 sender_id가 상대방
              const otherUserId = String(numericSenderId) === String(numericCurrentUserId) 
                ? String(numericReceiverId) 
                : String(numericSenderId);
              
              // 중요: sender_id가 현재 사용자와 일치하면 항상 'me', 아니면 'other'
              // isMe 판단을 다시 한 번 확인 (String으로 비교)
              const finalIsMe = String(numericSenderId) === String(numericCurrentUserId);
              
              const newMessage = {
                id: dmId,
                by: finalIsMe ? 'me' : 'other', // sender_id 기반으로 결정
                text: content,
                time: formatTime(new Date(createdAt)),
                timestamp: createdAt,
                sender_id: numericSenderId, // 디버깅용
                receiver_id: numericReceiverId // 디버깅용
              };
              
              console.log('📨 newMessage 생성:', {
                dmId,
                by: newMessage.by,
                senderId: numericSenderId,
                currentUserId: numericCurrentUserId,
                finalIsMe
              });
              
              console.log('📨 메시지를 conversations에 추가:', {
                otherUserId,
                selectedUserId: selectedUserIdRef.current,
                isMe: isMe,
                message: newMessage
              });
              
              // conversations state 업데이트 (선택된 사용자든 아니든 모두 추가)
              setConversations((prev) => {
                const userIdStr = String(otherUserId);
                
                // conversations에 해당 사용자가 없으면 생성
                if (!prev[userIdStr]) {
                  return {
                    ...prev,
                    [userIdStr]: {
                      user: {
                        id: userIdStr,
                        name: `사용자${userIdStr}`,
                        avatar: userIdStr.substring(0, 2).toUpperCase(),
                        role: '사용자'
                      },
                      messages: [newMessage]
                    }
                  };
                }
                
                // 중복 체크 (같은 id의 메시지가 이미 있으면 추가하지 않음)
                const existingMessage = prev[userIdStr].messages.find(m => 
                  m.id === dmId || 
                  (m.text === content && Math.abs(new Date(m.timestamp).getTime() - new Date(createdAt).getTime()) < 2000)
                );
                if (existingMessage) {
                  console.log('⚠️ 이미 존재하는 메시지, 스킵:', dmId);
                  return prev;
                }
                
                // 임시 메시지(temp_로 시작)가 있으면 실제 메시지로 교체
                // 주의: 내가 보낸 메시지만 교체 (isMe === true인 경우만)
                const tempMessageIndex = prev[userIdStr].messages.findIndex(m => 
                  m.id?.toString().startsWith('temp_') && 
                  m.text === content &&
                  m.by === 'me' &&
                  isMe // 내가 보낸 메시지인 경우에만 교체
                );
                
                let updatedMessages;
                if (tempMessageIndex !== -1 && isMe) {
                  // 임시 메시지를 실제 메시지로 교체
                  // ⚠️ 중요: 내가 보낸 메시지는 by: 'me'와 sender_id를 강제로 유지
                  updatedMessages = [...prev[userIdStr].messages];
                  updatedMessages[tempMessageIndex] = {
                    ...newMessage,
                    by: 'me', // ⚠️ 항상 'me'로 강제 유지 (내가 보낸 메시지)
                    sender_id: numericSenderId, // ⚠️ 명시적으로 재설정
                    receiver_id: numericReceiverId,
                    _isMyMessage: true, // 디버깅용
                    _currentUserId: numericCurrentUserId
                  };
                  console.log('✅ 임시 메시지를 실제 메시지로 교체 (by: me 강제 유지):', {
                    tempIndex: tempMessageIndex,
                    tempMessageId: prev[userIdStr].messages[tempMessageIndex]?.id,
                    newMessageId: dmId,
                    newMessageBy: updatedMessages[tempMessageIndex].by,
                    senderId: numericSenderId,
                    currentUserId: numericCurrentUserId,
                    isMe: isMe
                  });
                } else if (!isMe) {
                  // 상대방이 보낸 메시지는 새로 추가
                  updatedMessages = [...(prev[userIdStr].messages || []), newMessage];
                  console.log('✅ 상대방 메시지 추가:', {
                    newMessageId: dmId,
                    by: 'other',
                    senderId: numericSenderId,
                    currentUserId: numericCurrentUserId
                  });
                } else {
                  // 내가 보낸 메시지인데 임시 메시지를 찾지 못한 경우 (이상한 상황)
                  console.warn('⚠️ 내가 보낸 메시지인데 임시 메시지를 찾지 못함:', {
                    content: content.substring(0, 30),
                    isMe,
                    senderId: numericSenderId,
                    currentUserId: numericCurrentUserId,
                    existingMessages: prev[userIdStr].messages.map(m => ({ 
                      id: m.id, 
                      by: m.by, 
                      text: m.text?.substring(0, 20),
                      isTemp: m.id?.toString().startsWith('temp_')
                    }))
                  });
                  // 그래도 'me'로 추가
                  updatedMessages = [...(prev[userIdStr].messages || []), {
                    ...newMessage,
                    by: 'me', // ⚠️ 내가 보낸 메시지이므로 강제로 'me'
                    sender_id: numericSenderId, // ⚠️ 명시적으로 설정
                    receiver_id: numericReceiverId,
                    _isMyMessage: true, // 디버깅용
                    _currentUserId: numericCurrentUserId
                  }];
                  console.log('✅ 내가 보낸 메시지 추가 (임시 메시지 없음):', {
                    newMessageId: dmId,
                    by: 'me',
                    senderId: numericSenderId
                  });
                }
                
                // 메시지 추가
                const updatedConversations = {
                  ...prev,
                  [userIdStr]: {
                    ...prev[userIdStr],
                    messages: updatedMessages
                  }
                };
                
                // 선택된 사용자가 아니면 새 메시지 카운트 증가 (ref를 사용하여 최신 값 확인)
                const currentSelectedUserId = selectedUserIdRef.current;
                if (currentSelectedUserId && String(currentSelectedUserId) !== userIdStr && !isMe) {
                  setNewMessageCount(prev => ({
                    ...prev,
                    [userIdStr]: (prev[userIdStr] || 0) + 1
                  }));
                }
                
                return updatedConversations;
              });
              
              // 백엔드에도 메시지 저장 (동기화) - 비동기 처리 (이미 저장되어 있을 수 있으므로 에러 무시)
              if (senderId && receiverId && content) {
                messagesAPI.saveDMMessage({
                  sender_id: numericSenderId,
                  receiver_id: numericReceiverId,
                  content: content,
                  dm_id: dmId
                })
                .then(() => {
                  console.log('✅ WebSocket 수신 메시지를 백엔드에 저장 완료');
                })
                .catch((saveError) => {
                  // 이미 저장되어 있거나 에러가 나도 무시 (WebSocket으로 이미 수신했으므로)
                  console.warn('⚠️ WebSocket 수신 메시지 백엔드 저장 실패 (무시):', saveError.message);
                });
              }
            }
          }
        } catch (err) {
          console.error('❌ WebSocket 메시지 파싱 실패:', err);
          console.error('❌ 원본 메시지:', event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket 에러:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket 연결 종료');
        setWsConnected(false);
        
        // 재연결 시도 (5초 후)
        setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            console.log('🔄 WebSocket 재연결 시도...');
            initWebSocket();
          }
        }, 5000);
      };
    } catch (err) {
      console.error('WebSocket 연결 실패:', err);
      setWsConnected(false);
    }
  };

  // 대화 상대 목록 로드 (API 1: GET /api/messages/conversations)
  // [중요] 이 API를 호출하지 않으면 과거에 대화한 사람들이 목록에 나타나지 않음!
  // 예: 2계정이 로그인했을 때 1계정을 보려면 이 API를 반드시 호출해야 함
  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    
    console.log('📋 [2단계] 대화 상대 목록 API 호출 시작');
    console.log('📋 GET /api/messages/conversations');
    
    try {
      // 현재 사용자 정보 확인
      // sessionStorage 우선 사용 (각 창 독립적)
      const userDataStr = sessionStorage.getItem(AUTH_CONFIG.USER_KEY) || localStorage.getItem(AUTH_CONFIG.USER_KEY);
      const currentUser = userDataStr 
        ? JSON.parse(userDataStr) 
        : null;
      const currentUserId = currentUser?.id || currentUser?.userId;
      console.log('👤 현재 사용자 정보:', {
        currentUser,
        currentUserId,
        userIdType: typeof currentUserId
      });
      
      console.log('📤 API 요청 전송: GET /api/messages/conversations');
      const response = await messagesAPI.getConversations();
      console.log('✅ 대화 상대 목록 API 응답:', response);
      console.log('✅ 응답 타입:', typeof response, '배열 여부:', Array.isArray(response));
      console.log('✅ 응답 길이:', Array.isArray(response) ? response.length : 0);
      
      // API 응답을 conversations 형식으로 변환
      const conversationsMap = {};
      
      console.log('📋 대화 상대 목록 처리 시작:', {
        responseLength: response?.length || 0,
        responseType: typeof response,
        isArray: Array.isArray(response)
      });
      
      if (Array.isArray(response) && response.length > 0) {
        response.forEach((user, index) => {
          console.log(`📋 사용자 ${index}:`, user);
          const userId = String(user.user_id || user.userId || user.id);
          const username = user.username || user.name || `사용자${userId}`;
          
          console.log(`📋 사용자 ${index} 변환:`, {
            original: user,
            userId,
            username
          });
          
          conversationsMap[userId] = {
            user: {
              id: userId,
              name: username,
              avatar: username.substring(0, 2).toUpperCase(),
              role: user.role || '사용자'
            },
            messages: []
          };
        });
        console.log('✅ 변환된 conversations:', conversationsMap);
      console.log('✅ conversations 키 목록:', Object.keys(conversationsMap));
      console.log('✅ 대화 상대 수:', Object.keys(conversationsMap).length);
      } else {
        console.log('⚠️ 대화 상대가 없거나 빈 배열입니다.');
      }
      
      setConversations(conversationsMap);
      
      console.log('✅ [2단계 완료] 대화 상대 목록 로드 완료');
      console.log('💡 다음 단계: 사용자가 목록에서 사람을 클릭하면 3단계(GET /api/messages/with/:userId)가 호출됩니다.');
      
      // PostDetail에서 receiverId로 전달된 경우 자동으로 채팅창 열기
      if (location.state?.receiverId) {
        const receiverId = location.state.receiverId;
        const receiverIdStr = String(receiverId);
        
        console.log('📨 PostDetail에서 receiverId로 전달됨:', receiverId);
        
        // conversations에 해당 사용자가 없으면 추가
        if (!conversationsMap[receiverIdStr]) {
          const username = location.state.username || `사용자${receiverId}`;
          const name = location.state.name || username;
          
          setConversations((prev) => ({
            ...prev,
            [receiverIdStr]: {
              user: {
                id: receiverIdStr,
                name: name,
                avatar: username.substring(0, 2).toUpperCase(),
                role: '사용자'
              },
              messages: []
            }
          }));
        }
        
        // 자동으로 해당 사용자 선택 및 대화 내역 로드
        setSelectedUserId(receiverIdStr);
        loadMessagesWithUser(receiverIdStr);
        
        // state 제거 (한 번만 실행되도록)
        navigate(location.pathname, { replace: true, state: {} });
      }
      
      // 첫 번째 대화를 자동 선택하지 않음 (사용자가 선택하도록)
    } catch (err) {
      console.error('❌ [2단계 실패] 대화 목록 로드 실패:', err);
      console.error('❌ 에러 상세:', err.message, err);
      setError(handleAPIError(err));
      
      // 에러 발생 시 빈 객체로 설정
      setConversations({});
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ 메시지 불러오기 (REST API: GET /api/messages/with/:otherUserId)
  // [중요] 사용자가 가운데 칼럼에서 사람을 클릭하면 이 함수가 호출됨
  // 과거 대화 내역을 불러와서 오른쪽 채팅창을 채움
  // 예: 2계정이 1계정을 클릭하면 GET /api/messages/with/1 호출
  const loadMessagesWithUser = async (otherUserId) => {
    if (!otherUserId) {
      console.warn('⚠️ [3단계 스킵] otherUserId가 없습니다.');
      return;
    }
    
    // ⚠️ 중요: 최신 currentUserId를 매번 다시 가져오기 (새로고침 후에도 정확하게 판단하기 위해)
    const latestCurrentUserId = getCurrentUserId();
    
    // otherUserId를 문자열로 변환 (conversations 키로 사용)
    const userIdStr = String(otherUserId);
    
    // otherUserId를 숫자로 변환 시도 (API 호출용)
    const numericUserId = typeof otherUserId === 'number' 
      ? otherUserId 
      : (typeof otherUserId === 'string' && !isNaN(Number(otherUserId)) && !isNaN(parseInt(otherUserId, 10)))
        ? parseInt(otherUserId, 10)
        : null;
    
    console.log('📞 [3단계] 대화 내역 로드 시작:', {
      originalUserId: otherUserId,
      userIdStr: userIdStr,
      numericUserId: numericUserId,
      selectedUserId: selectedUserId,
      latestCurrentUserId: latestCurrentUserId, // ⚠️ 최신 값 확인
      previousCurrentUserId: numericCurrentUserId // 이전 값과 비교
    });
    console.log('📞 GET /api/messages/with/' + numericUserId);
    
    if (!numericUserId || isNaN(numericUserId)) {
      console.warn('⚠️ [3단계 스킵] 숫자 user_id를 찾을 수 없습니다. API 호출을 건너뜁니다.');
      setLoading(false);
      return;
    }
    
    if (!latestCurrentUserId || isNaN(latestCurrentUserId)) {
      console.error('❌ [3단계 실패] currentUserId를 찾을 수 없습니다. 메시지 구분이 불가능합니다.');
      setLoading(false);
      return;
    }
    
    try {
      // API는 숫자 user_id를 기대하므로 변환된 값을 사용
      console.log('📤 API 요청 전송: GET /api/messages/with/' + numericUserId);
      const response = await messagesAPI.getMessagesWithUser(numericUserId);
      console.log('✅ 대화 내역 API 응답:', response);
      console.log('✅ 응답 타입:', typeof response, '배열 여부:', Array.isArray(response));
      console.log('✅ 응답 길이:', Array.isArray(response) ? response.length : 0);
      
      // API 응답을 메시지 형식으로 변환 (DB 구조: dm_id, sender_id, receiver_id, content, created_at)
      const formattedMessages = Array.isArray(response) ? response.map((msg) => {
        // sender_id를 숫자로 변환
        const senderId = msg.sender_id || msg.senderId;
        const numericSenderId = typeof senderId === 'number' 
          ? senderId 
          : (typeof senderId === 'string' && !isNaN(Number(senderId))) 
            ? Number(senderId) 
            : null;
        
        // isMe 판단: sender_id와 currentUserId 비교
        const numericCurrentUserIdCheck = Number(latestCurrentUserId);
        const numericSenderIdCheck = Number(numericSenderId);
        const isMe = numericSenderIdCheck === numericCurrentUserIdCheck;
        
        // 단순하게 by 속성 설정
        return {
          id: msg.dm_id || msg.id || Date.now() + Math.random(),
          by: isMe ? 'me' : 'other',
          text: msg.content || msg.text || msg.message,
          time: formatTime(new Date(msg.created_at || msg.timestamp || Date.now())),
          timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
          sender_id: numericSenderId,
          receiver_id: msg.receiver_id || msg.receiverId
        };
      }) : [];
      
      // conversations에 메시지 추가 (userIdStr 사용)
      setConversations((prev) => {
        return {
          ...prev,
          [userIdStr]: {
            ...(prev[userIdStr] || {
              user: {
                id: userIdStr,
                name: `사용자${userIdStr}`,
                avatar: (userIdStr.length > 2 ? userIdStr.substring(0, 2) : userIdStr).toUpperCase(),
                role: '사용자'
              }
            }),
            messages: formattedMessages
          }
        };
      });
    } catch (err) {
      console.error('❌ 대화 내역 로드 실패:', err);
      console.error('❌ 요청한 userId:', numericUserId, '타입:', typeof numericUserId);
      
      // 500 에러인 경우 더 자세한 안내
      if (err.message.includes('500') || err.message.includes('서버 오류')) {
        console.error('⚠️ 백엔드 서버 오류: user_id가 숫자가 아닐 수 있습니다.');
        setError('대화 내역을 불러오는데 실패했습니다. 작성자 정보를 확인해주세요.');
      } else {
        setError(handleAPIError(err));
      }
      
      // 에러가 발생해도 conversations는 유지 (빈 메시지 배열)
      const userIdStr = String(otherUserId);
      setConversations((prev) => {
        if (prev[userIdStr]) {
          return {
            ...prev,
            [userIdStr]: {
              ...prev[userIdStr],
              messages: prev[userIdStr].messages || []
            }
          };
        }
        return prev;
      });
    }
  };

  // PostDetail에서 전달된 작성자 정보로 채팅 시작
  useEffect(() => {
    if (location.state?.startChatWith) {
      const { userId, username, name } = location.state.startChatWith;
      const userIdStr = String(userId);
      
      console.log('💬 게시글 작성자와 채팅 시작:', { userId: userIdStr, username, name, userIdType: typeof userId });
      
      // userId가 숫자로 변환 가능한지 확인 (백엔드 API는 숫자 user_id를 기대)
      const numericUserId = typeof userId === 'number' 
        ? userId 
        : (typeof userId === 'string' && !isNaN(Number(userId)) && userId.trim() !== '' && !isNaN(parseInt(userId, 10)))
          ? parseInt(userId, 10)
          : null;
      
      const canLoadMessages = numericUserId !== null && !isNaN(numericUserId);
      
      console.log('💬 userId 검증:', { 
        original: userId, 
        originalType: typeof userId,
        numericUserId,
        canLoadMessages,
        willLoadMessages: canLoadMessages
      });
      
      // conversations에 해당 사용자 추가 (없는 경우)
      setConversations((prev) => {
        if (!prev[userIdStr]) {
          return {
            ...prev,
            [userIdStr]: {
              user: {
                id: userIdStr,
                name: name || username || `사용자${userIdStr}`,
                avatar: (name || username || 'U').substring(0, 2).toUpperCase(),
                role: '사용자'
              },
              messages: []
            }
          };
        }
        return prev;
      });
      
      // 해당 사용자 선택
      setSelectedUserId(userIdStr);
      
      // 숫자 user_id가 있으면 대화 내역 로드, 없으면 빈 대화만 시작 (메시지 전송은 가능)
      if (canLoadMessages) {
        console.log('✅ 숫자 user_id 확인됨, 대화 내역 로드 시도:', numericUserId);
        loadMessagesWithUser(userIdStr);
      } else {
        console.warn('⚠️ user_id가 숫자가 아닙니다. 대화 내역을 불러오지 않습니다.');
        console.warn('⚠️ 백엔드 게시글 API에 user_id 필드가 필요합니다.');
        console.warn('⚠️ 현재 userId:', userId, '타입:', typeof userId);
        // 빈 대화로 시작 (사용자는 메시지를 보낼 수 있음)
      }
      
      // state 제거 (한 번만 실행되도록)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // 페이지 로드 시 API 호출 순서 (중요!)
  // [DM 페이지 연동 가이드]
  // 1단계: WebSocket 연결 (실시간 준비)
  // 2단계: GET /api/messages/conversations (대화 상대 목록)
  // 3단계: 사용자 클릭 시 GET /api/messages/with/:userId (대화 내역)
  useEffect(() => {
    console.log('🚀 DM 페이지 초기화 시작');
    
    // 1단계: WebSocket 연결 (실시간 메시지를 받기 위한 준비)
    // 이 연결로 실시간으로 새로운 메시지를 받을 수 있음
    console.log('📡 1단계: WebSocket 연결 시작...');
    initWebSocket();
    
    // 2단계: 대화 상대 목록 로드 (HTTP API)
    // 이 API를 호출하지 않으면 다른 계정이 보이지 않음!
    // 예: 2계정이 로그인했을 때 1계정을 보려면 이 API를 반드시 호출해야 함
    console.log('📋 2단계: 대화 상대 목록 API 호출 시작...');
    loadConversations();
    
    console.log('✅ DM 페이지 초기화 완료');
    console.log('💡 3단계는 사용자가 가운데 칼럼에서 사람을 클릭하면 자동으로 호출됩니다.');
    
    return () => {
      // 컴포넌트 언마운트 시 WebSocket 연결 종료
      if (wsRef.current) {
        console.log('🔌 WebSocket 연결 종료 (컴포넌트 언마운트)');
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

  useEffect(() => {
    // 로컬 스토리지 동기화 (API 실패 시 백업용)
    if (Object.keys(conversations).length > 0) {
      localStorage.setItem("chat_conversations_v1", JSON.stringify(conversations));
    }
  }, [conversations]);
  
  // 선택된 사용자의 메시지가 변경될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (chatRef.current && selectedUserId) {
      const selectedUserIdStr = String(selectedUserId);
      // 약간의 딜레이를 주어 DOM 업데이트 후 스크롤
      setTimeout(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
      }, 100);
    }
  }, [conversations[String(selectedUserId)]?.messages, selectedUserId]);

  // 선택된 사용자의 메시지 가져오기
  const selectedUserIdStr = selectedUserId ? String(selectedUserId) : null;
  const currentMessages = selectedUserIdStr && conversations[selectedUserIdStr] 
    ? conversations[selectedUserIdStr].messages 
    : [];
  
  const selectedUser = selectedUserIdStr ? conversations[selectedUserIdStr]?.user : null;
  
  // 디버깅용 로그
  useEffect(() => {
    if (selectedUserIdStr) {
      console.log('🔍 현재 선택된 대화 상태:', {
        selectedUserIdStr,
        conversationExists: !!conversations[selectedUserIdStr],
        messageCount: currentMessages.length,
        conversationsKeys: Object.keys(conversations),
        selectedUser: selectedUser
      });
    }
  }, [selectedUserIdStr, conversations, currentMessages.length, selectedUser]);

  const sendMessage = async (text, userId) => {
    if (!text.trim() || !userId) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('WebSocket 연결이 되어있지 않습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // ⚠️ 중요: 최신 currentUserId를 매번 다시 가져오기 (로그인한 사용자 정보에 맞게)
    const latestCurrentUserId = getCurrentUserId();
    if (!latestCurrentUserId || isNaN(latestCurrentUserId)) {
      console.error('❌ CRITICAL: 메시지를 보낼 수 없습니다. currentUserId가 유효하지 않습니다!', {
        latestCurrentUserId,
        userId: selectedUserId
      });
      alert('로그인이 필요합니다. 페이지를 새로고침하고 다시 로그인해주세요.');
      return;
    }

    // userId를 숫자로 변환 시도
    const numericUserId = typeof userId === 'number' 
      ? userId 
      : (typeof userId === 'string' && !isNaN(Number(userId)) && !isNaN(parseInt(userId, 10)))
        ? parseInt(userId, 10)
        : null;
    
    if (numericUserId === null || isNaN(numericUserId)) {
      console.error('❌ user_id가 숫자가 아닙니다. 메시지를 전송할 수 없습니다:', userId);
      alert('작성자 정보를 확인할 수 없습니다. 백엔드 게시글에 user_id 필드가 필요합니다.');
      return;
    }

    const now = new Date();
    // 임시 메시지 ID (WebSocket 서버 응답으로 받은 실제 dm_id로 교체됨)
    const tempMessageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const message = { 
      id: tempMessageId, 
      by: "me", // 내가 보낸 메시지는 항상 'me'
      text: text.trim(), 
      time: formatTime(now),
      timestamp: now.toISOString(),
      pending: true, // 전송 중임을 표시
      sender_id: latestCurrentUserId, // ⚠️ 최신 currentUserId 사용
      receiver_id: numericUserId
    };
    
    // 3️⃣ 메시지 보내기 - 즉시 UI에 추가 (낙관적 업데이트)
    // 화면에 즉시 반영하여 실시간 느낌 제공
    setConversations((prev) => {
      const userIdStr = String(userId);
      const currentMessages = prev[userIdStr]?.messages || [];
      
      // 중복 체크 (같은 텍스트와 시간의 메시지가 이미 있으면 추가하지 않음)
      const alreadyExists = currentMessages.some(m => 
        m.id === tempMessageId || 
        (m.by === 'me' && 
         m.text === text.trim() && 
         Math.abs(new Date(m.timestamp).getTime() - now.getTime()) < 2000)
      );
      
      if (alreadyExists) {
        console.log('⚠️ 이미 추가된 메시지, 스킵');
        return prev;
      }
      
      // 메시지의 by 속성을 다시 한 번 확인하고 강제로 'me'로 설정
      // ⚠️ 중요: 내가 보낸 메시지는 반드시 by: 'me'와 sender_id를 명시적으로 설정
      const finalMessage = {
        ...message,
        by: 'me', // ⚠️ 내가 보낸 메시지는 항상 'me'로 강제 설정
        sender_id: latestCurrentUserId, // ⚠️ 최신 currentUserId 사용
        receiver_id: numericUserId
      };
      
      return {
        ...prev,
        [userIdStr]: {
          ...prev[userIdStr],
          messages: [...currentMessages, finalMessage]
        }
      };
    });
    
    try {
      // 3️⃣ 메시지 보내기 (WebSocket)
      // WebSocket 서버로 메시지 전송
      const messageData = {
        type: 'dm',
        receiverId: numericUserId,
        content: text.trim()
      };
      const messageJson = JSON.stringify(messageData);
      console.log('📤 WebSocket으로 메시지 전송:', {
        messageData,
        receiverId: numericUserId,
        senderId: latestCurrentUserId, // ⚠️ 최신 currentUserId 사용
        tempMessageId: tempMessageId
      });
      
      // WebSocket 전송
      wsRef.current.send(messageJson);
      
      console.log('✅ WebSocket 메시지 전송 완료, 서버 응답 대기 중...');
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setError(handleAPIError(err));
      
      // 실패 시 메시지 제거 (롤백)
      setConversations((prev) => ({
        ...prev,
        [String(userId)]: {
          ...prev[String(userId)],
          messages: prev[String(userId)].messages.filter(m => m.id !== message.id)
        }
      }));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedUserId) return;
    
    setSending(true);
    const messageText = input.trim();
    setInput("");
    
    try {
      await sendMessage(messageText, selectedUserId);
    } catch (err) {
      console.error('메시지 전송 실패:', err);
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectUser = (userId) => {
    if (!userId) {
      console.warn('⚠️ handleSelectUser: userId가 없습니다');
      return;
    }
    
    const userIdStr = String(userId);
    console.log('🔍 사용자 선택:', { userId, userIdStr, type: typeof userId });
    
    try {
      setSelectedUserId(userIdStr);
      setInput("");
      // 선택된 사용자와의 대화 내역 로드 (API 2)
      loadMessagesWithUser(userIdStr);
      console.log('✅ handleSelectUser 완료');
    } catch (error) {
      console.error('❌ handleSelectUser 오류:', error);
    }
  };

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }


  function clearChat() {
    if (!selectedUserId) return;
    if (confirm("이 대화의 기록을 지우시겠습니까?")) {
      setConversations((prev) => ({
        ...prev,
        [selectedUserId]: {
          ...prev[selectedUserId],
          messages: []
        }
      }));
    }
  }

  return (
    <div className="min-h-screen bg-[#4b2e9f]">
      <TopNav />
      <div className="p-8">
        <div className="max-w-screen-xl mx-auto">
          <div className="mt-8 bg-[#4b2e9f] rounded-xl p-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4">
                <LeftMenu />
              </div>

              <div className="col-span-3">
                <CenterPanel 
                  conversations={conversations} 
                  selectedUserId={selectedUserId}
                  onSelectUser={handleSelectUser}
                  loading={loading}
                  newMessageCount={newMessageCount}
                  setNewMessageCount={setNewMessageCount}
                />
              </div>

              <div className="col-span-5">
                {selectedUser ? (
                <section className="flex-1 bg-white rounded-xl p-6 shadow-md flex flex-col h-[620px]">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-300 flex items-center justify-center text-white font-semibold">
                          {selectedUser.avatar}
                        </div>
                      <div>
                          <div className="font-medium text-gray-800">{selectedUser.name}</div>
                          <div className="text-xs text-slate-500">{selectedUser.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} title={wsConnected ? '연결됨' : '연결 안됨'}></div>
                        <button className="text-sm text-slate-500 hover:text-slate-700" onClick={clearChat}>지우기</button>
                      <div className="text-slate-400">⋮</div>
                    </div>
                  </div>

                  <div ref={chatRef} className="flex-1 border rounded-lg p-6 bg-white/50 overflow-auto">
                      {currentMessages.length === 0 ? (
                      <div className="text-center text-sm text-slate-500 mt-10">아직 대화가 없습니다. 메시지를 보내보세요.</div>
                      ) : (
                        currentMessages.map((m) => (
                          <ChatBubble key={m.id} msg={m} otherAvatar={selectedUser.avatar} currentUser={user} />
                        ))
                      )}
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <textarea
                        id="chat-message-input"
                        name="message"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        placeholder="Write a message..."
                        className="flex-1 resize-none border rounded-xl px-4 py-3 text-sm focus:outline-none min-h-[60px]"
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending}
                        className="w-14 h-14 rounded-full bg-indigo-900 text-white flex items-center justify-center disabled:opacity-60"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </section>
                ) : (
                  <section className="flex-1 bg-white rounded-xl p-6 shadow-md flex flex-col h-[620px] items-center justify-center">
                    <div className="text-center text-slate-500">
                      <div className="text-4xl mb-4">💬</div>
                      <div className="text-lg font-medium mb-2">대화를 선택하세요</div>
                      <div className="text-sm">목록에서 사람을 선택하여 대화를 시작하세요.</div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Icons ---------------------------------- */
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-7 9 7" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
