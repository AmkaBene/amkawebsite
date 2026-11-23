import {useEffect, useState, type FormEvent} from 'react';
import {onAuthStateChanged, signInWithPopup, signOut, type User} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import {
  Disc3,
  Droplets,
  Fish,
  Heart,
  LogOut,
  MessageSquarePlus,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

type StickerId = 'star' | 'bubble' | 'disc' | 'fish' | 'heart' | 'spark';

interface VisitorNoteItem {
  id: string;
  authorName: string;
  message: string;
  sticker: StickerId;
  createdAtMs: number;
  createdAtLabel: string;
}

const STICKERS: {id: StickerId; label: string}[] = [
  {id: 'star', label: 'Silver Star'},
  {id: 'bubble', label: 'Aero Bubble'},
  {id: 'disc', label: 'Y2K Disc'},
  {id: 'fish', label: 'Aquarium Fish'},
  {id: 'heart', label: 'Heart'},
  {id: 'spark', label: 'Sparkle'},
];

function StickerIcon({id, className = 'h-4 w-4'}: {id: StickerId; className?: string}) {
  switch (id) {
    case 'star':
      return <Star className={className} />;
    case 'bubble':
      return <Droplets className={className} />;
    case 'disc':
      return <Disc3 className={className} />;
    case 'fish':
      return <Fish className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'spark':
    default:
      return <Sparkles className={className} />;
  }
}

function formatNoteDate(ts: Timestamp | null | undefined): {ms: number; label: string} {
  if (!ts) {
    return {ms: Date.now(), label: 'Just now'};
  }
  const d = ts.toDate();
  return {
    ms: d.getTime(),
    label: d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

export function VisitorNotesBoard() {
  const [notes, setNotes] = useState<VisitorNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [sticker, setSticker] = useState<StickerId>('star');
  const [submitting, setSubmitting] = useState(false);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const notesQuery = query(
      collection(db, 'visitor_notes'),
      where('isPublic', '==', true),
      limit(60),
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const items: VisitorNoteItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as {
            authorName?: string;
            message?: string;
            sticker?: StickerId;
            createdAt?: Timestamp | null;
          };
          const timeMeta = formatNoteDate(data.createdAt);
          return {
            id: docSnap.id,
            authorName: data.authorName || 'Visitor',
            message: data.message || '',
            sticker: STICKERS.some((s) => s.id === data.sticker)
              ? (data.sticker as StickerId)
              : 'star',
            createdAtMs: timeMeta.ms,
            createdAtLabel: timeMeta.label,
          };
        });
        items.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setNotes(items);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        try {
          handleFirestoreError(error, OperationType.LIST, 'visitor_notes');
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const isAmkaAdmin =
    Boolean(user) &&
    user?.email === 'amkabene@gmail.com' &&
    user?.emailVerified === true;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormNotice(null);

    const cleanName = authorName.trim();
    const cleanMsg = message.trim();

    if (!cleanName) {
      setFormNotice('Please enter your name or handle.');
      return;
    }
    if (!cleanMsg) {
      setFormNotice('Please write a short note before posting.');
      return;
    }

    const noteId = `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const path = `visitor_notes/${noteId}`;

    setSubmitting(true);
    try {
      await setDoc(doc(db, 'visitor_notes', noteId), {
        authorName: cleanName.slice(0, 40),
        message: cleanMsg.slice(0, 280),
        sticker,
        isPublic: true,
        createdAt: serverTimestamp(),
      });
      setMessage('');
      setFormNotice('Note pinned to the silver wall.');
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const path = `visitor_notes/${noteId}`;
    setDeletingId(noteId);
    try {
      await deleteDoc(doc(db, 'visitor_notes', noteId));
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, path);
      } catch (wrapped) {
        setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdminSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setFormNotice('Sign-in popup was closed or cancelled.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div id="notes" className="mt-10 sm:mt-12">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#40566E] dark:text-[#9EB6CF]">
            Shared Guestbook · Live Cloud Wall
          </p>
          <h3 className="mt-1.5 font-display text-xl font-bold tracking-tight text-[#0C1C2C] dark:text-[#ECF4FD] sm:text-2xl">
            Visitor Notes
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-[#40566E] dark:text-[#9EB6CF]">
          <span className="font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'} posted
          </span>

          {isAmkaAdmin ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Owner Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdminSignIn}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#0369A1] dark:text-[#38BDF8]" />
              <span>Amka Mod Login</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {/* Brushed Y2K Silver Header */}
        <div className="aero-silver-header flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD]">
            <MessageSquarePlus className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
            <span>Leave a Note for Amka &amp; Visitors</span>
          </div>
          {isAmkaAdmin && (
            <span className="text-xs font-medium text-[#047857] dark:text-[#34D399]">
              Owner Moderation Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 aero-well p-4 sm:p-6 lg:grid-cols-12">
          {/* Compose Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-5 flex flex-col gap-4 rounded-xl border border-[#B5C4D6] dark:border-[#365273] bg-white/85 dark:bg-[#0D1E32]/90 p-4 sm:p-5"
          >
            <div>
              <label
                htmlFor="visitor-note-name"
                className="block text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] mb-1.5"
              >
                Your Name or Handle
              </label>
              <input
                id="visitor-note-name"
                type="text"
                maxLength={40}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Suwon classmate, Ulaanbaatar friend..."
                className="w-full min-h-[44px] rounded-lg border border-[#A8BCD2] dark:border-[#355272] bg-white dark:bg-[#091829] px-3 py-2 text-base sm:text-sm text-[#0C1C2C] dark:text-[#ECF4FD] placeholder:text-[#6B8199] focus:outline-2 focus:outline-[#0369A1] dark:focus:outline-[#38BDF8]"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] mb-1.5">
                Pick a Y2K Stamp
              </span>
              <div className="grid grid-cols-3 gap-2">
                {STICKERS.map((item) => {
                  const selected = sticker === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSticker(item.id)}
                      className={`min-h-[44px] sm:min-h-[38px] flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                        selected
                          ? 'aero-btn-aqua'
                          : 'aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD]'
                      }`}
                    >
                      <StickerIcon id={item.id} className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{item.label.split(' ').pop()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="visitor-note-message"
                  className="text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD]"
                >
                  Note Message
                </label>
                <span className="text-[11px] text-[#40566E] dark:text-[#9EB6CF] tabular-nums">
                  {message.length}/280
                </span>
              </div>
              <textarea
                id="visitor-note-message"
                rows={4}
                maxLength={280}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say hi, drop a song rec, or share your high score..."
                className="w-full rounded-lg border border-[#A8BCD2] dark:border-[#355272] bg-white dark:bg-[#091829] px-3 py-2.5 text-base sm:text-sm text-[#0C1C2C] dark:text-[#ECF4FD] placeholder:text-[#6B8199] focus:outline-2 focus:outline-[#0369A1] dark:focus:outline-[#38BDF8] resize-y"
              />
            </div>

            {formNotice && (
              <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8]">
                {formNotice}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-auto inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold aero-btn-aqua disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Pinning Note...' : 'Post Note to Wall'}</span>
            </button>
          </form>

          {/* Notes Grid */}
          <div className="lg:col-span-7 flex flex-col">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[1, 2, 3, 4].map((skeleton) => (
                  <div
                    key={skeleton}
                    className="h-32 rounded-xl border border-[#B5C4D6] dark:border-[#2C4766] bg-white/60 dark:bg-[#0E2035]/70 animate-pulse"
                  />
                ))}
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[#A2B8CE] dark:border-[#345070] bg-white/55 dark:bg-[#0D1E32]/65 p-8 text-center">
                <Sparkles className="h-7 w-7 text-[#0369A1] dark:text-[#38BDF8]" />
                <p className="mt-3 font-display text-base font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
                  The silver wall is waiting for its first note
                </p>
                <p className="mt-1 max-w-xs text-xs text-[#40566E] dark:text-[#9EB6CF]">
                  Write a greeting, music recommendation, or high score on the left to pin it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {notes.map((note) => (
                  <article
                    key={note.id}
                    className="flex flex-col justify-between rounded-xl border border-[#B5C4D6] dark:border-[#345070] bg-gradient-to-b from-white/95 to-[#EBF3FC]/90 dark:from-[#12263D]/95 dark:to-[#0B1B2D]/95 p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg aero-silver-frame text-[#0369A1] dark:text-[#38BDF8]">
                            <StickerIcon id={note.sticker} className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate font-display text-sm font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
                            {note.authorName}
                          </span>
                        </div>

                        {isAmkaAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingId === note.id}
                            aria-label={`Delete note from ${note.authorName}`}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg aero-btn-silver text-[#BE123C] dark:text-[#FDA4AF]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1E3348] dark:text-[#D5E6F7]">
                        {note.message}
                      </p>
                    </div>

                    <p className="mt-3 text-[11px] font-medium text-[#546C85] dark:text-[#8BA6C2]">
                      {note.createdAtLabel}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
