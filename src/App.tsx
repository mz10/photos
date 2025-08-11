import React, { useState, useEffect, useCallback } from 'react';
import { AlbumGrid } from './AlbumGrid.tsx';
import { PhotoGrid } from './PhotoGrid.tsx';
import { Lightbox } from './Lightbox.tsx';
import { Login } from './Login.tsx';
import { UserList } from './UserList.tsx';
import { LatestCommentsWidget } from './LatestCommentsWidget.tsx';
import { api } from './api.ts';
import type { User } from './types.ts';

// A safer way to detect if we're in a production-like environment.
// The test environment runs from a 'blob:' URL, which we can detect.
// Real environments will use 'http:' or 'https:.
const isProductionEnv = window.location.protocol.startsWith('http');

const App = () => {
    // In production, get path from URL. In sandbox, start at root.
    const getInitialPath = () => (isProductionEnv ? window.location.pathname : '/');

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [path, setPath] = useState(getInitialPath());
    // Save the initial path to redirect to after login
    const [redirectPath, setRedirectPath] = useState(getInitialPath());
    const [isCommentsWidgetVisible, setIsCommentsWidgetVisible] = useState(false);


    const navigateTo = useCallback((newPath: string) => {
        if (isProductionEnv) {
            // Only manipulate history in a real environment
            window.history.pushState({ path: newPath }, '', newPath);
        }
        // In both cases, we update the state to trigger a re-render
        setPath(newPath);
    }, []);
    
    // Listen for browser back/forward buttons in production
    useEffect(() => {
        if (!isProductionEnv) return;

        const onPopState = (event: PopStateEvent) => {
            // When the user navigates with back/forward buttons, update the path.
            setPath(window.location.pathname);
        };
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        // Navigate to the originally intended path after login.
        // `navigateTo` will handle the URL correctly if in production.
        navigateTo(redirectPath === '/' ? '/' : redirectPath);
    };
    
    const handleLogout = () => {
        setCurrentUser(null);
        setIsCommentsWidgetVisible(false);
        navigateTo('/');
    };
    
    const handleOpenLightboxFromComment = async (photoId: string) => {
        try {
            const photo = await api.getPhotoDetails(photoId);
            if (photo) {
                navigateTo(`/album/${photo.albumId}/photo/${photo.id}`);
            } else {
                console.error("Could not find photo details to open lightbox.");
                alert("Nepodařilo se najít příslušnou fotografii.");
            }
        } catch (e) {
            console.error("Error opening lightbox from comment:", e);
            alert("Při otevírání fotografie došlo k chybě.");
        }
    };

    if (!currentUser) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    const parts = path.split('/').filter(Boolean);
    const view = parts[0];
    const albumId = view === 'album' ? parts[1] : null;
    const photoId = view === 'album' && parts[2] === 'photo' ? parts[3] : null;

    const renderContent = () => {
        if (view === 'users' && currentUser.role === 'admin') {
            return <UserList currentUser={currentUser} />;
        }

        if (albumId) {
            return <PhotoGrid albumId={albumId} navigateTo={navigateTo} />;
        }
        
        return <AlbumGrid navigateTo={navigateTo} />;
    };
    
    // The navigation links should not use `href` directly for navigation
    // to prevent page reloads. `navigateTo` handles it all.
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
        e.preventDefault();
        navigateTo(targetPath);
    };

    return (
        <>
            <header className="app-header">
                <div className="header-nav">
                    {currentUser.role === 'admin' ? (
                        <nav>
                           <a href="/" onClick={(e) => handleNavClick(e, '/')} className={!view || view === 'album' ? 'active' : ''}>Alba</a>
                           <a href="/users" onClick={(e) => handleNavClick(e, '/users')} className={view === 'users' ? 'active' : ''}>Uživatelé</a>
                        </nav>
                    ) : (
                        <h2>Moje Alba</h2>
                    )}
                </div>
                <div className="user-info">
                     {currentUser.role === 'admin' && (
                         <button 
                            className={`comments-toggle-button ${isCommentsWidgetVisible ? 'active' : ''}`}
                            onClick={() => setIsCommentsWidgetVisible(!isCommentsWidgetVisible)}
                            title="Zobrazit nejnovější komentáře"
                         >
                            Komentáře
                         </button>
                    )}
                    <span>Přihlášen jako: <strong>{currentUser.name}</strong></span>
                    <button onClick={handleLogout}>Odhlásit se</button>
                </div>
            </header>

            <main className={`app-container ${isCommentsWidgetVisible ? 'with-comments-widget' : ''}`}>
                {renderContent()}
            </main>

            {currentUser.role === 'admin' && (
                <LatestCommentsWidget
                    isVisible={isCommentsWidgetVisible}
                    onOpenLightboxFromComment={handleOpenLightboxFromComment}
                />
            )}

            {albumId && photoId && (
                <Lightbox 
                    albumId={albumId}
                    photoId={photoId}
                    navigateTo={navigateTo}
                    currentUser={currentUser}
                />
            )}
        </>
    );
};

export default App;