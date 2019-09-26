k-d-baum
========

kdtree.js

Nutzung: (Beispiel für 3d-Punkte)

Baum aufbauen:
--------------
let kd=new KDTree([10,2,12]);
kd.add([30,40,50]);
kd.add([0,2,9]);
...

Nahester Punkt zu [x,y,z]:
--------------------------
let point, distance;
[point, distance] = kd.findNearestPoint([x,y,z])



test.js

Tests für kdtree.js

Beispiel:
Test.everrything() - Testet alle Funktionen
Test.testBuilding() - Testet das Erstellen von k-d-Bäumen

Fehler in test.js:
- Wenn doppelte Punkte generiert werden und einer davon gelöscht wird, wird
  der andere Punkt noch gefunden. Dies wird aber als Fehler angezeigt!
  -> Plan: Diesen Fall zumindest bei der Ausgabe markieren, um ihn von einem
  echten Fehler zu unterscheiden.


