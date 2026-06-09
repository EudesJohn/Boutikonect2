import { useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import StarRating from './StarRating';
import { createReview } from '../lib/database';
import toast from 'react-hot-toast';

/**
 * ReviewForm — A reusable review submission form (inline, not modal).
 *
 * Props:
 *   targetType  : 'product' | 'service'
 *   targetId    : string — The product or service UUID
 *   reviewerId  : string — The authenticated user's UUID
 *   onSuccess   : function — Called after the review is successfully created
 *   onCancel    : function — Called when the user cancels
 */
export default function ReviewForm({ targetType, targetId, reviewerId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating) {
      toast.error('Veuillez donner une note.');
      return;
    }
    if (!reviewerId) {
      toast.error('Vous devez etre connecte pour publier un avis.');
      return;
    }

    setSubmitting(true);
    try {
      // Arrondir la note (StarRating peut retourner 0.5 via le toggle)
      const finalRating = Math.round(rating);

      const payload = {
        reviewer_id: reviewerId,
        rating: finalRating,
        comment: comment.trim() || null,
      };

      if (targetType === 'service') {
        payload.service_id = targetId;
      } else {
        payload.product_id = targetId;
      }

      await createReview(payload);
      toast.success('Avis publie avec succes !');
      setRating(0);
      setComment('');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la publication de l avis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-amber-400" />
          Donner mon avis
        </h4>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            Annuler
          </button>
        )}
      </div>

      {/* Star selector */}
      <div className="flex items-center gap-3 mb-4">
        <StarRating
          rating={rating}
          interactive
          onRate={setRating}
          size="lg"
        />
        {rating > 0 && (
          <span className="text-sm text-gray-400">
            {rating === 1 ? 'Tres mauvais' :
             rating === 2 ? 'Mauvais' :
             rating === 3 ? 'Moyen' :
             rating === 4 ? 'Bon' :
             'Excellent'}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Partagez votre experience (optionnel)..."
        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none placeholder-gray-500 mb-4"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || !rating}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Publication...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Publier l avis
          </>
        )}
      </button>

      <p className="text-[10px] text-gray-600 mt-2 text-center">
        Votre avis sera visible apres validation par un administrateur.
      </p>
    </form>
  );
}
