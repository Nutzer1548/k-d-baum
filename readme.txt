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

oder (gleichverteilte Punkte)
let points=[ [1,2], [50,9], [3,3], [..].. ],
led kd=KDTree.createBalanced(points);


Nahester Punkt zu [x,y,z]:
--------------------------
let point, distance;
[point, distance] = kd.findNearestPoint([x,y,z]);
let realDistance = Math.sqrt(distance);



test.js

Tests für kdtree.js

Beispiele:
Test.everything(7,5000) - Testet alle Funktionen mit 7 Dimensionen und 5000 Punkten
Test.testBuilding(5,1000,20) - Testet das Erstellen von k-d-Bäumen mit 5 Dimensionen, 1000 Punkten in 20 Durchläufen


