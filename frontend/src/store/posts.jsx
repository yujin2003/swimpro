import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { postsAPI, handleAPIError } from "../services/api.js";

const PostsCtx = createContext(null);
const LS_KEY = "mentoring_posts_v1";

const AVATARS = ["🧑🏻‍🎨","🧑🏽‍🚀","🧑🏼‍✈️","🧑🏾‍🌾","🧑🏻‍🏫","🧑🏿‍🔧","🧑🏽‍🎤","🧑‍🦰"];

// 시드 데이터 함수 제거 - 사용자가 작성한 게시글만 표시

function getPostFormPosts() {
  try {
    const raw = localStorage.getItem("posts_v1");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 공통: 게시글 ID 정규화
  const getPostId = (p) => (p?.post_id ?? p?.id);

  // API에서 게시글 목록 로드 (useCallback으로 안정적인 참조 유지)
  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiPosts = await postsAPI.getAllPosts();
      console.log('📋 API에서 받은 게시글들:', apiPosts);
      console.log('📋 첫 번째 게시글 ID:', apiPosts[0]?.id, '타입:', typeof apiPosts[0]?.id);
      // 한 번에 업데이트하여 리렌더링 최소화
      setPosts(apiPosts);
    } catch (err) {
      console.error('게시글 로드 실패:', err);
      
      // 오프라인 모드인 경우 에러를 표시하지 않음
      if (err.message === 'OFFLINE_MODE') {
        console.log('오프라인 모드: 로컬 데이터를 사용합니다.');
      } else {
        setError(handleAPIError(err));
      }
      
      // API 실패 시 로컬 데이터로 폴백 (PostForm에서 작성된 게시글만)
      const postFormData = getPostFormPosts();
      const convertedPostFormData = postFormData.map((post, index) => ({
        id: `form_${post.id || Date.now() + index}`,
        author: "yeah(남성)",
        timestamp: new Date(post.createdAt || post.editedAt).toLocaleDateString('ko-KR', { 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        title: post.title,
        body: post.content,
        dateText: `${post.date} ${post.startTime}${post.endTime ? ` - ${post.endTime}` : ''}`,
        placeText: post.selectedRegion || post.region || "기흥역 근처",
        region: post.selectedRegion || post.region || "기흥역 근처",
        stroke: post.selectedStroke,
        minutesAgo: Math.floor((Date.now() - new Date(post.createdAt || post.editedAt).getTime()) / (1000 * 60)),
        avatar: AVATARS[index % AVATARS.length],
        createdAt: post.createdAt,
        editedAt: post.editedAt,
      }));
      
      // PostForm에서 작성된 게시글만 표시
      setPosts(convertedPostFormData);
    } finally {
      setLoading(false);
    }
  }, []); // 의존성 배열 비움 - 함수는 안정적이어야 함

  // 컴포넌트 마운트 시 게시글 로드
  useEffect(() => {
    loadPosts();
  }, []);

  // 로컬 스토리지 동기화 (API 실패 시 백업용)
  useEffect(() => {
    if (posts.length > 0) {
    localStorage.setItem(LS_KEY, JSON.stringify(posts));
    }
  }, [posts]);

  const updatePost = async (id, patch) => {
    try {
      await postsAPI.updatePost(id, patch);
      // 서버 권위 데이터로 재로딩 (중복/불일치 방지)
      await loadPosts();
    } catch (err) {
      console.error('게시글 수정 실패:', err);
      setError(handleAPIError(err));
      // 로컬에서만 업데이트
      setPosts((prev) => prev.map((p) => (getPostId(p) === id ? { ...p, ...patch } : p)));
    }
  };

  const addPost = async (newPost) => {
    try {
      const createdPost = await postsAPI.createPost(newPost);
      // 생성 후에는 목록을 서버에서 다시 가져와 단 한 번만 노출되게 함
      await loadPosts();
    } catch (err) {
      console.error('게시글 생성 실패:', err);
      setError(handleAPIError(err));
      // 로컬에서만 추가
      setPosts((prev) => {
        const exists = prev.some(post => getPostId(post) === getPostId(newPost));
        if (exists) return prev;
        return [newPost, ...prev];
      });
    }
  };

  const removePost = async (id) => {
    try {
      await postsAPI.deletePost(id);
      await loadPosts();
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      setError(handleAPIError(err));
      // 로컬에서만 삭제
      setPosts((prev) => prev.filter(post => getPostId(post) !== id));
    }
  };

  // PostForm 데이터 변경 시 멘토링 시스템 동기화
  const syncPostFormData = () => {
    const postFormData = getPostFormPosts();
    const convertedPostFormData = postFormData.map((post, index) => ({
      id: `form_${post.id || Date.now() + index}`,
      author: "yeah(남성)",
      timestamp: new Date(post.createdAt || post.editedAt).toLocaleDateString('ko-KR', { 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      title: post.title,
      body: post.content,
      dateText: `${post.date} ${post.startTime}${post.endTime ? ` - ${post.endTime}` : ''}`,
      placeText: post.selectedRegion || post.region || "기흥역 근처",
      region: post.selectedRegion || post.region || "기흥역 근처",
      stroke: post.selectedStroke,
      minutesAgo: Math.floor((Date.now() - new Date(post.createdAt || post.editedAt).getTime()) / (1000 * 60)),
      avatar: AVATARS[index % AVATARS.length],
      createdAt: post.createdAt,
      editedAt: post.editedAt,
    }));
    
    // PostForm에서 작성된 게시글만 표시
    setPosts(convertedPostFormData);
  };

  const value = useMemo(() => ({ 
    posts, 
    loading, 
    error, 
    updatePost, 
    addPost, 
    removePost, 
    syncPostFormData,
    loadPosts 
  }), [posts, loading, error, loadPosts]);
  return <PostsCtx.Provider value={value}>{children}</PostsCtx.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsCtx);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
