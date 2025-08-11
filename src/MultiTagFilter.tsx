
import React, { useState, useEffect, useRef } from 'react';
import { api } from './api.ts';

interface MultiTagFilterProps {
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
}

export const MultiTagFilter = ({ selectedTags, onSelectedTagsChange }: MultiTagFilterProps) => {
    const [inputValue, setInputValue] = useState('');
    const [allTags, setAllTags] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.getAllTags().then(setAllTags);
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);

        if (value.trim()) {
            const filtered = allTags.filter(tag => 
                tag.toLowerCase().includes(value.toLowerCase()) && !selectedTags.includes(tag)
            );
            setSuggestions(filtered.slice(0, 10)); // Limit suggestions
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };
    
    const addTag = (tag: string) => {
        const newTag = tag.trim();
        if (newTag && !selectedTags.includes(newTag)) {
            onSelectedTagsChange([...selectedTags, newTag]);
        }
        setInputValue('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };
    
    const removeTag = (tagToRemove: string) => {
        onSelectedTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && inputValue) {
            e.preventDefault();
            if (suggestions.length > 0) {
                addTag(suggestions[0]);
            } else {
                addTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
            removeTag(selectedTags[selectedTags.length - 1]);
        }
    };
    
    return (
        <div className="multi-tag-filter" ref={containerRef}>
            <div className="tags-container" onClick={() => inputRef.current?.focus()}>
                {selectedTags.map(tag => (
                    <span key={tag} className="tag-pill">
                        {tag}
                        <button onClick={() => removeTag(tag)}>&times;</button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue && setShowSuggestions(true)}
                    placeholder={selectedTags.length === 0 ? "Hledat štítky..." : ""}
                    className="tag-filter-input"
                    aria-label="Filtrovat podle štítků"
                />
            </div>
            {showSuggestions && suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map(suggestion => (
                        <li 
                            key={suggestion}
                            onClick={() => addTag(suggestion)}
                            className="suggestion-item"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && addTag(suggestion)}
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
