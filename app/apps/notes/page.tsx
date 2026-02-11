'use client';

import { Plus, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdDate: string;
  color: 'yellow' | 'pink' | 'blue' | 'green';
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Project Ideas',
    content: 'Brainstorm ideas for new features...',
    createdDate: '2024-01-25',
    color: 'yellow',
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Discussion points from today...',
    createdDate: '2024-01-24',
    color: 'pink',
  },
  {
    id: '3',
    title: 'Code Snippets',
    content: 'Useful code examples...',
    createdDate: '2024-01-23',
    color: 'blue',
  },
];

const colorStyles: Record<string, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  pink: 'bg-pink-100 border-pink-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
};

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState<{
    title: string;
    content: string;
    color: 'yellow' | 'pink' | 'blue' | 'green';
  }>({
    title: '',
    content: '',
    color: 'yellow',
  });

  const addNote = () => {
    if (newNote.title.trim()) {
      setNotes([
        ...notes,
        {
          id: String(notes.length + 1),
          ...newNote,
          createdDate: new Date().toISOString().split('T')[0],
        },
      ]);
      setNewNote({ title: '', content: '', color: 'yellow' });
      setShowForm(false);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-600 mt-1">Keep track of your thoughts and ideas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          New Note
        </button>
      </div>

      {/* New Note Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <input
            type="text"
            placeholder="Note title..."
            value={newNote.title}
            onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500"
          />
          <textarea
            placeholder="Note content..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:border-blue-500 h-32"
          />
          <div className="flex gap-2 items-center mb-4">
            <label className="text-sm font-medium text-gray-700">Color:</label>
            {['yellow', 'pink', 'blue', 'green'].map((color) => (
              <button
                key={color}
                onClick={() =>
                  setNewNote({
                    ...newNote,
                    color: color as 'yellow' | 'pink' | 'blue' | 'green',
                  })
                }
                className={`w-6 h-6 rounded-full ${colorStyles[color]} ${
                  newNote.color === color ? 'ring-2 ring-offset-2' : ''
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={addNote}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Save Note
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`rounded-lg shadow-sm p-6 border-2 ${colorStyles[note.color]}`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">{note.title}</h3>
              <button
                onClick={() => deleteNote(note.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4 line-clamp-4">
              {note.content}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock size={14} />
              <span>{new Date(note.createdDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
