import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api.ts';
import type { User } from './types.ts';

interface UserListProps {
  currentUser: User;
}

const CATEGORY_LABELS: Record<User['category'], string> = {
    family: 'Rodina',
    friend: 'Přítel',
    other: 'Ostatní'
};

export const UserList = ({ currentUser }: UserListProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const userList = await api.getUsers();
      setUsers(userList);
    } catch (err) {
      setError('Nepodařilo se načíst uživatele.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleToggleBlock = async (userToToggle: User) => {
    if (userToToggle.id === currentUser.id) return;
    
    const originalUsers = users;
    setUsers(currentUsers => 
        currentUsers.map(u => 
            u.id === userToToggle.id ? { ...u, isBlocked: !u.isBlocked } : u
        )
    );

    try {
        await api.updateUserStatus(userToToggle.id, !userToToggle.isBlocked);
    } catch(e) {
        console.error("Failed to update user status", e);
        setUsers(originalUsers);
        alert(`Akce se nezdařila pro uživatele ${userToToggle.name}.`);
    }
  };
  
  const handleCategoryChange = async (userId: string, newCategory: User['category']) => {
    const originalUsers = [...users];
    setUsers(currentUsers =>
        currentUsers.map(u => (u.id === userId ? { ...u, category: newCategory } : u))
    );
    try {
        await api.updateUserCategory(userId, newCategory);
    } catch (e) {
        console.error("Failed to update user category", e);
        setUsers(originalUsers);
        alert('Nepodařilo se změnit kategorii.');
    }
  };

  if (loading) return <div className="loader"></div>;
  
  return (
    <div className="user-list-container">
        <h1>Správa uživatelů</h1>

      {error && <p className="error" style={{textAlign: 'center', marginBottom: '1rem'}}>{error}</p>}
      <div className="table-wrapper">
        <table className="user-table">
            <thead>
            <tr>
                <th>Jméno</th>
                <th>Role</th>
                <th>Kategorie</th>
                <th>Stav</th>
                <th>Akce</th>
            </tr>
            </thead>
            <tbody>
            {users.map(user => (
                <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>
                    <div className="select-wrapper">
                        <select
                            value={user.category}
                            onChange={(e) => handleCategoryChange(user.id, e.target.value as User['category'])}
                            disabled={user.id === currentUser.id}
                        >
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </td>
                <td>
                    <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                    {user.isBlocked ? 'Zablokovaný' : 'Aktivní'}
                    </span>
                </td>
                <td>
                    <button 
                    onClick={() => handleToggleBlock(user)}
                    disabled={user.id === currentUser.id}
                    className={`action-button ${user.isBlocked ? 'unblock' : 'block'}`}
                    >
                    {user.isBlocked ? 'Odblokovat' : 'Zablokovat'}
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};