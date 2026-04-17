-- Trigger function for purchase details (increase stock)
CREATE OR REPLACE FUNCTION public.handle_achat_detail_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.produits
  SET stock = stock + NEW.quantity, updated_at = now()
  WHERE id = NEW.produit_id;

  INSERT INTO public.stock_movements (produit_id, type, quantity, reason, user_id)
  VALUES (NEW.produit_id, 'entree', NEW.quantity, 'Achat ' || NEW.achat_id::text, auth.uid());

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_achat_detail_insert
AFTER INSERT ON public.achat_details
FOR EACH ROW
EXECUTE FUNCTION public.handle_achat_detail_insert();

-- Trigger function for sale details (decrease stock)
CREATE OR REPLACE FUNCTION public.handle_vente_detail_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT stock INTO current_stock FROM public.produits WHERE id = NEW.produit_id;

  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stock insuffisant pour ce produit (disponible: %, demandé: %)', current_stock, NEW.quantity;
  END IF;

  UPDATE public.produits
  SET stock = stock - NEW.quantity, updated_at = now()
  WHERE id = NEW.produit_id;

  INSERT INTO public.stock_movements (produit_id, type, quantity, reason, user_id)
  VALUES (NEW.produit_id, 'sortie', NEW.quantity, 'Vente ' || NEW.vente_id::text, auth.uid());

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vente_detail_insert
AFTER INSERT ON public.vente_details
FOR EACH ROW
EXECUTE FUNCTION public.handle_vente_detail_insert();