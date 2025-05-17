import { useEffect, useState } from 'react';
import './App.css';

type Post = {
  id: number;
  content: string;
  imageUrl: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: string[];
};

const API_URL = 'https://final-api-sn9c.onrender.com/api/posts';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState({ content: '', imageUrl: '', author: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState<{ [key: number]: string }>({});
  const [showCommentBox, setShowCommentBox] = useState<{ [key: string]: boolean }>({});
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPosts();
    const storedLikes = localStorage.getItem('likedPosts');
    if (storedLikes) {
      setLikedPosts(new Set(JSON.parse(storedLikes)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('likedPosts', JSON.stringify(Array.from(likedPosts)));
  }, [likedPosts]);

  const fetchPosts = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((p: any) => ({
          ...p,
          likes: p.likes ?? 0,
          comments: p.comments ?? []
        }));
        setPosts(formatted.reverse());
      })
      .catch(console.error);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewPost(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    const postData = { ...newPost, likes: 0, comments: [] };

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    })
      .then(() => {
        setNewPost({ content: '', imageUrl: '', author: '' });
        setEditingId(null);
        fetchPosts();
      })
      .catch(console.error);
  };

  const handleEdit = (post: Post) => {
    setNewPost({ content: post.content, imageUrl: post.imageUrl, author: post.author });
    setEditingId(post.id);
  };

  const handleDelete = (id: number) => {
    setShowCommentBox({ ...showCommentBox, ['delete-' + id]: true });
    setShowMenu(null);
  };

  const confirmDelete = (id: number) => {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(() => {
        setShowCommentBox(prev => {
          const newState = { ...prev };
          delete newState['delete-' + id];
          return newState;
        });
        fetchPosts();
      })
      .catch(console.error);
  };

  const cancelDelete = (id: number) => {
    setShowCommentBox(prev => {
      const newState = { ...prev };
      delete newState['delete-' + id];
      return newState;
    });
  };

  const handleLike = (id: number) => {
    const alreadyLiked = likedPosts.has(id);

    setPosts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, likes: alreadyLiked ? p.likes - 1 : p.likes + 1 } : p
      )
    );

    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (alreadyLiked) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCommentToggle = (id: number) => {
    setShowCommentBox(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleComment = (id: number) => {
    const comment = commentInput[id]?.trim();
    if (!comment) return;
    setPosts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
    setCommentInput({ ...commentInput, [id]: "" });
    setShowCommentBox(prev => ({ ...prev, [id]: false }));
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-title">Faceboinks</div>
      </nav>

      <div className="app">
        <form onSubmit={handleSubmit} className="post-form">
          <input
            type="text"
            name="author"
            placeholder="Author"
            value={newPost.author}
            onChange={handleChange}
            required
          />
          <textarea
            name="content"
            placeholder="What's on your mind?"
            value={newPost.content}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="imageUrl"
            placeholder="Image URL (optional)"
            value={newPost.imageUrl}
            onChange={handleChange}
          />
          <button type="submit" className="button-primary">
            {editingId ? 'Update Post' : 'Create Post'}
          </button>
        </form>

        <div className="post-list">
          {posts.map(post => (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="profile"
                  className="profile-pic"
                />
                <div>
                  <strong>{post.author}</strong>
                  <div className="timestamp">
                    {new Date(post.createdAt).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                    {Math.abs(
                      new Date(post.createdAt).getTime() - new Date(post.updatedAt).getTime()
                    ) > 1000 && ' (edited)'}
                  </div>
                </div>

                <div className="meatball-menu">
                  <div 
                    className="meatball-icon"
                    onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                  >
                    ⋮
                  </div>
                  
                  {showMenu === post.id && (
                    <div className="menu-options">
                      <div 
                        className="menu-option"
                        onClick={() => {
                          handleEdit(post);
                          setShowMenu(null);
                        }}
                      >
                        <span>✏️</span> Edit
                      </div>
                      <div 
                        className="menu-option delete"
                        onClick={() => handleDelete(post.id)}
                      >
                        <span>🗑️</span> Delete
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="post-content">{post.content}</div>
              {post.imageUrl && (
                <img src={post.imageUrl} alt="post" className="post-image" />
              )}

              <div className="post-actions">
                <div 
                  className={`post-action ${likedPosts.has(post.id) ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  Like ({post.likes})
                </div>
                <div 
                  className="post-action"
                  onClick={() => handleCommentToggle(post.id)}
                >
                  Comment
                </div>
                <div className="post-action">Share</div>
              </div>

              {showCommentBox[post.id] && (
                <div className="comment-form">
                  <textarea
                    className="comment-input"
                    placeholder="Add a comment..."
                    value={commentInput[post.id] || ""}
                    onChange={(e) =>
                      setCommentInput({ ...commentInput, [post.id]: e.target.value })
                    }
                  />
                  <div className="comment-actions">
                    <button 
                      className="button-secondary"
                      onClick={() => handleCommentToggle(post.id)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="button-primary"
                      onClick={() => handleComment(post.id)}
                    >
                      Comment
                    </button>
                  </div>
                </div>
              )}

              <div className="comments-list">
                {post.comments.map((comment, index) => (
                  <div key={index} className="comment">
                    <div className="comment-content">{comment}</div>
                  </div>
                ))}
              </div>

              {showCommentBox['delete-' + post.id] && (
                <div className="modal-overlay">
                  <div className="modal">
                    <h3>Confirm Delete</h3>
                    <p>Are you sure you want to delete this post?</p>
                    <div className="modal-buttons">
                      <button 
                        className="button-secondary"
                        onClick={() => cancelDelete(post.id)}
                      >
                        Cancel
                      </button>
                      <button 
                        className="button-primary"
                        onClick={() => confirmDelete(post.id)}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
