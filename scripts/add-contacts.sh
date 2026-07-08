#!/usr/bin/env bash
# Insert the BravoSecure test contacts into a device's address book so the app
# can resolve the other accounts for calling. Usage:
#   bash scripts/add-contacts.sh <serial>
# Skips a name that already has a phone row (re-runnable).
S="$1"
[ -z "$S" ] && { echo "usage: add-contacts.sh <serial>"; exit 1; }

existing() {
  adb -s "$S" shell content query --uri content://com.android.contacts/data \
    --projection display_name --where "mimetype='vnd.android.cursor.item/phone_v2'" 2>/dev/null \
    | grep -c "display_name=$1"
}

add_contact() {
  local NAME="$1" PHONE="$2"
  if [ "$(existing "$NAME")" != "0" ]; then echo "  skip $NAME (exists)"; return; fi
  adb -s "$S" shell content insert --uri content://com.android.contacts/raw_contacts \
    --bind account_name:s: --bind account_type:s: >/dev/null 2>&1
  local RID
  RID=$(adb -s "$S" shell content query --uri content://com.android.contacts/raw_contacts \
    --projection _id 2>/dev/null | grep -oE '_id=[0-9]+' | grep -oE '[0-9]+' | tail -1)
  adb -s "$S" shell content insert --uri content://com.android.contacts/data \
    --bind raw_contact_id:i:"$RID" --bind mimetype:s:vnd.android.cursor.item/name \
    --bind data1:s:"$NAME" >/dev/null 2>&1
  adb -s "$S" shell content insert --uri content://com.android.contacts/data \
    --bind raw_contact_id:i:"$RID" --bind mimetype:s:vnd.android.cursor.item/phone_v2 \
    --bind data1:s:"$PHONE" --bind data2:i:2 >/dev/null 2>&1
  echo "  added $NAME ($PHONE) raw_id=$RID"
}

echo "== adding contacts to $S =="
# Mapping confirmed against credentials.env + the device's own number:
#   Shirajul (client1) = +8801318402075   ITSirajul (client2) = +8801968602328
#   Fahim    (client3) = +8801727994251
add_contact "Shirajul Islam" "+8801318402075"
add_contact "ITSirajul"      "+8801968602328"
add_contact "Fahim Islam"    "+8801727994251"
echo "== phone contacts now on $S =="
adb -s "$S" shell content query --uri content://com.android.contacts/data \
  --projection display_name,data1 --where "mimetype='vnd.android.cursor.item/phone_v2'" 2>/dev/null
