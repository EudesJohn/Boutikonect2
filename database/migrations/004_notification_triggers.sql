-- ============================================================
-- Migration 004: Auto-create notifications for messages, orders
-- ============================================================
-- Exécuter dans l'éditeur SQL de Supabase :
--   1. Aller à https://supabase.com/dashboard/project/logueiaidsizrmhujxzu
--   2. SQL Editor → New query
--   3. Coller et exécuter
-- ============================================================

-- 1. FUNCTION: notify_on_new_message
-- Crée une notification pour le destinataire d'un nouveau message
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_receiver_id UUID;
  v_conversation RECORD;
BEGIN
  -- Récupérer les infos de la conversation
  SELECT * INTO v_conversation FROM conversations WHERE id = NEW.conversation_id;

  -- Déterminer le destinataire (celui qui n'a pas envoyé le message)
  IF v_conversation.buyer_id = NEW.sender_id THEN
    v_receiver_id := v_conversation.seller_id;
  ELSE
    v_receiver_id := v_conversation.buyer_id;
  END IF;

  -- Récupérer le nom de l'expéditeur
  SELECT full_name INTO v_sender_name FROM profiles WHERE id = NEW.sender_id;
  v_sender_name := COALESCE(v_sender_name, 'Un utilisateur');

  -- Créer la notification
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    v_receiver_id,
    'message',
    'Nouveau message',
    v_sender_name || ' vous a envoyé un message.',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_name', v_sender_name,
      'link', '/messages',
      'preview', LEFT(NEW.content, 100)
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create it
DROP TRIGGER IF EXISTS on_new_message_notify ON messages;
CREATE TRIGGER on_new_message_notify
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();


-- 2. FUNCTION: notify_on_order_status_change
-- Crée une notification quand le statut d'une commande change
CREATE OR REPLACE FUNCTION notify_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_product_title TEXT;
  v_notif_title TEXT;
  v_notif_body TEXT;
BEGIN
  -- Ne déclencher que si le statut a changé
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Récupérer le titre du produit
  IF NEW.product_id IS NOT NULL THEN
    SELECT title INTO v_product_title FROM products WHERE id = NEW.product_id;
  ELSE
    SELECT title INTO v_product_title FROM services WHERE id = NEW.service_id;
  END IF;
  v_product_title := COALESCE(v_product_title, 'Commande');

  -- Notification pour l'acheteur
  v_notif_title := CASE NEW.status
    WHEN 'confirmed' THEN 'Commande confirmée'
    WHEN 'processing' THEN 'Commande en cours de traitement'
    WHEN 'shipped' THEN 'Commande expédiée'
    WHEN 'delivered' THEN 'Commande livrée'
    WHEN 'cancelled' THEN 'Commande annulée'
    WHEN 'refunded' THEN 'Remboursement effectué'
    ELSE 'Statut de commande mis à jour'
  END;

  v_notif_body := CASE NEW.status
    WHEN 'confirmed' THEN 'Votre commande "' || v_product_title || '" a été confirmée.'
    WHEN 'processing' THEN 'Votre commande "' || v_product_title || '" est en cours de traitement.'
    WHEN 'shipped' THEN 'Votre commande "' || v_product_title || '" a été expédiée.'
    WHEN 'delivered' THEN 'Votre commande "' || v_product_title || '" a été livrée. Merci !'
    WHEN 'cancelled' THEN 'Votre commande "' || v_product_title || '" a été annulée.'
    WHEN 'refunded' THEN 'Votre commande "' || v_product_title || '" a été remboursée.'
    ELSE 'Le statut de votre commande "' || v_product_title || '" a changé à : ' || NEW.status
  END;

  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.buyer_id,
    'order',
    v_notif_title,
    v_notif_body,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'status', NEW.status,
      'product_title', v_product_title,
      'link', '/orders'
    )
  );

  -- Si le vendeur est différent de l'acheteur, notifier aussi le vendeur
  IF NEW.seller_id != NEW.buyer_id THEN
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES (
      NEW.seller_id,
      'order',
      CASE NEW.status
        WHEN 'confirmed' THEN 'Nouvelle commande'
        WHEN 'cancelled' THEN 'Commande annulée'
        ELSE 'Commande mise à jour'
      END,
      CASE NEW.status
        WHEN 'confirmed' THEN 'Vous avez reçu une commande pour "' || v_product_title || '".'
        WHEN 'cancelled' THEN 'La commande de "' || v_product_title || '" a été annulée.'
        ELSE 'La commande "' || v_product_title || '" a changé de statut.'
      END,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'status', NEW.status,
        'product_title', v_product_title,
        'link', '/seller/orders'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_change_notify ON orders;
CREATE TRIGGER on_order_status_change_notify
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_order_status_change();


-- 3. FUNCTION: notify_on_new_order
-- Crée une notification quand une nouvelle commande est créée
CREATE OR REPLACE FUNCTION notify_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  v_product_title TEXT;
BEGIN
  -- Récupérer le titre du produit
  IF NEW.product_id IS NOT NULL THEN
    SELECT title INTO v_product_title FROM products WHERE id = NEW.product_id;
  ELSE
    SELECT title INTO v_product_title FROM services WHERE id = NEW.service_id;
  END IF;
  v_product_title := COALESCE(v_product_title, 'Commande');

  -- Notifier le vendeur
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.seller_id,
    'order',
    'Nouvelle commande reçue',
    'Vous avez reçu une commande pour "' || v_product_title || '".',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'product_title', v_product_title,
      'link', '/seller/orders'
    )
  );

  -- Notifier l'acheteur
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.buyer_id,
    'order',
    'Commande confirmée',
    'Votre commande "' || v_product_title || '" a bien été enregistrée.',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'product_title', v_product_title,
      'link', '/orders'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_order_notify ON orders;
CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_order();


-- Vérifier que tout est OK
SELECT '✅ Notifications triggers created successfully' AS status;
