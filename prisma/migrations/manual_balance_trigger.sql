CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit  NUMERIC;
  total_credit NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(debit), 0),
    COALESCE(SUM(credit), 0)
  INTO total_debit, total_credit
  FROM journal_lines
  WHERE "entryId" = NEW."entryId";

  IF total_debit <> total_credit THEN
    RAISE EXCEPTION
      'Journal entry % is unbalanced: debits=% credits=%',
      NEW."entryId", total_debit, total_credit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_journal_balance
AFTER INSERT OR UPDATE ON journal_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION check_journal_balance();