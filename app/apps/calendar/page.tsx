'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Edit2, 
  Trash2,
  Clock,
  MapPin,
  Users,
  Bell,
  Repeat,
  Search
} from 'lucide-react';
import ExportButton from '@/components/ExportButton';

interface Event {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location: string | null;
  color: string;
  attendees: string | null;
  reminder: number | null;
  recurrence: string | null;
  createdAt: string;
  updatedAt: string;
}

type ToastType = 'success' | 'error' | 'info';
type ViewMode = 'month' | 'week' | 'day';

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: '',
    color: 'blue',
    attendees: [] as string[],
    reminder: 15,
    recurrence: 'none'
  });
  const [attendeeInput, setAttendeeInput] = useState('');

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewMode]);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Calculer la période selon le mode d'affichage
      let startDate: Date;
      let endDate: Date;

      if (viewMode === 'month') {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
      } else if (viewMode === 'week') {
        const day = currentDate.getDay();
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - day);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59);
      } else {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59);
      }

      const res = await fetch(
        `/api/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      } else {
        setToast({ message: 'Erreur lors du chargement des événements', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = events.filter(event =>
      event.title.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
    setFilteredEvents(filtered);
  };

  const handleCreateEvent = async () => {
    if (!formData.title.trim()) {
      setToast({ message: 'Le titre est requis', type: 'error' });
      return;
    }

    const startDateTime = formData.allDay
      ? new Date(formData.startDate)
      : new Date(`${formData.startDate}T${formData.startTime}`);
    
    const endDateTime = formData.allDay
      ? new Date(formData.endDate)
      : new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime < startDateTime) {
      setToast({ message: 'La date de fin doit être après la date de début', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          allDay: formData.allDay,
          location: formData.location,
          color: formData.color,
          attendees: formData.attendees,
          reminder: formData.reminder,
          recurrence: formData.recurrence
        })
      });

      if (res.ok) {
        setToast({ message: 'Événement créé avec succès', type: 'success' });
        setShowModal(false);
        resetForm();
        await loadEvents();
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Erreur lors de la création', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !formData.title.trim()) return;

    const startDateTime = formData.allDay
      ? new Date(formData.startDate)
      : new Date(`${formData.startDate}T${formData.startTime}`);
    
    const endDateTime = formData.allDay
      ? new Date(formData.endDate)
      : new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime < startDateTime) {
      setToast({ message: 'La date de fin doit être après la date de début', type: 'error' });
      return;
    }

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          allDay: formData.allDay,
          location: formData.location,
          color: formData.color,
          attendees: formData.attendees,
          reminder: formData.reminder,
          recurrence: formData.recurrence
        })
      });

      if (res.ok) {
        setToast({ message: 'Événement mis à jour avec succès', type: 'success' });
        setShowModal(false);
        setEditingEvent(null);
        resetForm();
        await loadEvents();
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Erreur lors de la mise à jour', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    }
  };

  const handleDeleteEvent = (eventId: number) => {
    setEventToDelete(eventId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      const res = await fetch(`/api/events/${eventToDelete}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setToast({ message: 'Événement supprimé avec succès', type: 'success' });
        await loadEvents();
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: startDate.toISOString().split('T')[0],
      startTime: event.allDay ? '' : startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: event.allDay ? '' : endDate.toTimeString().slice(0, 5),
      allDay: event.allDay,
      location: event.location || '',
      color: event.color,
      attendees: event.attendees ? JSON.parse(event.attendees) : [],
      reminder: event.reminder || 15,
      recurrence: event.recurrence || 'none'
    });
    setShowModal(true);
  };

  const openCreateModal = (date?: Date) => {
    resetForm();
    if (date) {
      const dateStr = date.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: dateStr,
        endDate: dateStr,
        startTime: '09:00',
        endTime: '10:00'
      }));
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      allDay: false,
      location: '',
      color: 'blue',
      attendees: [],
      reminder: 15,
      recurrence: 'none'
    });
    setAttendeeInput('');
    setEditingEvent(null);
  };

  const addAttendee = () => {
    if (!attendeeInput.trim()) return;
    if (formData.attendees.includes(attendeeInput.trim())) {
      setToast({ message: 'Ce participant existe déjà', type: 'error' });
      return;
    }
    setFormData(prev => ({
      ...prev,
      attendees: [...prev.attendees, attendeeInput.trim()]
    }));
    setAttendeeInput('');
  };

  const removeAttendee = (attendee: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== attendee)
    }));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      return (
        (eventStart >= dateStart && eventStart <= dateEnd) ||
        (eventEnd >= dateStart && eventEnd <= dateEnd) ||
        (eventStart <= dateStart && eventEnd >= dateEnd)
      );
    });
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600',
      red: 'bg-red-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-600',
      yellow: 'bg-yellow-600'
    };
    return colors[color] || 'bg-blue-600';
  };

  const formatTime = (date: string, allDay: boolean) => {
    if (allDay) return 'Toute la journée';
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = () => {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    if (viewMode === 'month') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const start = new Date(currentDate);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
    } else {
      return `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const daysArray = [];

    // Jours vides avant le 1er du mois
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(<div key={`empty-${i}`} className="p-2 border border-gray-700"></div>);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();

      daysArray.push(
        <div
          key={day}
          className={`p-2 border border-gray-700 min-h-[120px] cursor-pointer hover:bg-slate-700/30 transition-colors ${isToday ? 'bg-blue-600/10' : ''}`}
          onClick={() => openCreateModal(date)}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className={`${getColorClass(event.color)} text-white text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80`}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(event);
                }}
              >
                {formatTime(event.startDate, event.allDay)} - {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-400 px-2">
                +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="p-2 text-center font-semibold bg-slate-700 border border-gray-600">
            {day}
          </div>
        ))}
        {daysArray}
      </div>
    );
  };

  const renderEventList = () => {
    if (filteredEvents.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun événement pour cette période</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {filteredEvents.map(event => (
          <div
            key={event.id}
            className="bg-slate-800 rounded-lg p-4 border border-gray-700 hover:border-gray-500 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-1 h-16 ${getColorClass(event.color)} rounded`}></div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.startDate, event.allDay)}
                      {!event.allDay && ` - ${formatTime(event.endDate, event.allDay)}`}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    )}
                    {event.attendees && JSON.parse(event.attendees).length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {JSON.parse(event.attendees).length} participant{JSON.parse(event.attendees).length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(event)}
                  className="p-2 hover:bg-slate-700 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="p-2 hover:bg-red-600/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Calendrier</h1>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton 
              data={filteredEvents} 
              filename="evenements" 
              title="Événements"
              excludeFields={['userId']}
            />
            <button
              onClick={() => openCreateModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvel événement
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={previousPeriod}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold ml-4">{formatDateHeader()}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded transition-colors ${viewMode === 'month' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}
              >
                Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded transition-colors ${viewMode === 'week' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded transition-colors ${viewMode === 'day' ? 'bg-blue-600' : 'hover:bg-slate-600'}`}
              >
                Jour
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-gray-700 overflow-hidden">
            {viewMode === 'month' ? renderMonthView() : renderEventList()}
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de l'événement..."
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* All Day Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="allDay" className="text-sm font-medium cursor-pointer">
                  Toute la journée
                </label>
              </div>

              {/* Start Date/Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date de début *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    max={formData.endDate || undefined}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                {!formData.allDay && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Heure de début</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* End Date/Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date de fin *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                {!formData.allDay && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Heure de fin</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Lieu
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ajouter un lieu..."
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium mb-2">Couleur</label>
                <div className="flex gap-2">
                  {['blue', 'red', 'green', 'purple', 'orange', 'yellow'].map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-full ${getColorClass(color)} ${formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {/* Attendees */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Participants
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    placeholder="Email du participant..."
                    className="flex-1 px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addAttendee}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.attendees.map((attendee) => (
                    <span
                      key={attendee}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm flex items-center gap-2"
                    >
                      {attendee}
                      <button onClick={() => removeAttendee(attendee)}>
                        <X className="w-3 h-3 hover:text-blue-300" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Reminder & Recurrence */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Rappel
                  </label>
                  <select
                    value={formData.reminder}
                    onChange={(e) => setFormData({ ...formData, reminder: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value={0}>Pas de rappel</option>
                    <option value={5}>5 minutes avant</option>
                    <option value={15}>15 minutes avant</option>
                    <option value={30}>30 minutes avant</option>
                    <option value={60}>1 heure avant</option>
                    <option value={1440}>1 jour avant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Récurrence
                  </label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="none">Aucune</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                    <option value="yearly">Annuelle</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3 justify-end sticky bottom-0 bg-slate-800">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingEvent ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-lg max-w-md w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-red-400">Confirmer la suppression</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-300">Êtes-vous sûr de vouloir supprimer cet événement ?</p>
              <p className="text-sm text-gray-500 mt-2">Cette action est irréversible.</p>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEventToDelete(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
