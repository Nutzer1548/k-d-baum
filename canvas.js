"use strict";

function Point(x,y){
	this.x=x;
	this.y=y;
	this.toString=function(){
		return "P["+x+","+y+"]";
	};
	this.toArray=function(){return [x,y];};
}// end #Point()

let WIDTH=512;
let HEIGHT=512;
let points=[];
let testTree; // for KDTree testing

let kdtree=null;
let crossPath=null;

let selectedPoint={
	point: null,
	radius: 10
};
let selRect=null;

let ray={x:0, y:480, dx:WIDTH, dy:50};

function init(){
	// Strahl normalisieren
	let rayLen=Math.sqrt(Math.pow(ray.dx-ray.x,2) + Math.pow(ray.dy-ray.y,2));
	ray.dx=(ray.dx-ray.x)/rayLen;
	ray.dy=(ray.dy-ray.y)/rayLen;
	// create points
	points=[];
	for(let i=0; i<15; i++){
		let x=Math.random()*WIDTH;
		let y=Math.random()*HEIGHT;
		x=Number.parseInt(x);
		y=Number.parseInt(y);
		points.push(new Point(x,y));
	}

	testTree=new KDTree(points[0].toArray()); for(let i=1; i<points.length; i++) testTree.add(points[i].toArray());

	// sort in tree
	for(let i=0; i<points.length; i++) treeAdd(points[i]);
	// cross-shape (for points)
	let s=2;
	crossPath=new Path2D();
	crossPath.moveTo(-s, -s);
	crossPath.lineTo(+s, +s);
	crossPath.moveTo(-s, +s);
	crossPath.lineTo(+s, -s);
	// draw
	draw();
	// events
	let canvas=document.querySelector("#canvas");
	document.getElementById("canvas").addEventListener('click', function(e){
		let r=e.target.getBoundingClientRect();
		let x=Number.parseInt(e.clientX-r.x);
		let y=Number.parseInt(e.clientY-r.y);
		//console.log(`'- x=${x}, y=${y}`);
		/*let len=points.push(new Point(x,y));
		treeAdd(points[len-1]); // */
		treeFindNearest(x,y);
		selectedPoint.mouse=new Point(x,y);
		draw();
	});
	document.querySelector("#canvas").addEventListener('mousemove',function(e){
		document.querySelector("#status").innerText="X:"+e.layerX+" \nY:"+e.layerY;
	});
}// end #init()

// draws a Point object
function pset(ctx,p){
//	ctx.fillRect(p.x-s, p.y-s, 2*s+1, 2*s+1);
//	let s=2;
	ctx.translate(p.x,p.y);
	ctx.stroke(crossPath);
	ctx.translate(-p.x,-p.y);
	/*ctx.beginPath();
	ctx.moveTo(p.x-s, p.y-s);
	ctx.lineTo(p.x+s, p.y+s);
	ctx.moveTo(p.x-s, p.y+s);
	ctx.lineTo(p.x+s, p.y-s);
	ctx.stroke(); // */
}


function draw(){
	let canvas=document.getElementById("canvas");
	if(!canvas.getContext) return;
	let ctx=canvas.getContext("2d");
	ctx.lineWidth=1;
	ctx.setTransform(1,0,0,1,0.5,0.5);// für scharfe, pixelgenaue Linien bei einer Linienbreite von 1
	ctx.fillStyle="#fff";
	ctx.fillRect(0,0,WIDTH, HEIGHT);
	//ctx.clearRect(0,0,WIDTH, HEIGHT);

	ctx.fillStyle="#000";
	ctx.strokeStyle="#00f";
	for(let i=0; i<points.length; i++){
		pset(ctx, points[i]);
	}
	ctx.fillStyle="#f00";
	ctx.strokeStyle="rgba(0,0,255,0.5)";
	drawNode(ctx);

	drawNode2(ctx);

	if(selectedPoint.point!==null){
		ctx.strokeStyle="rgba(255,0,0,0.75)";
		ctx.beginPath();
		let p=selectedPoint.point;
		ctx.arc(p.x, p.y, selectedPoint.radius, 0, 2*Math.PI);
		ctx.stroke();
	}

	// Strahl
	ctx.strokeStyle="#f00";
	let m=WIDTH/ray.dx;
	ctx.beginPath();
	ctx.moveTo(ray.x, ray.y);
	ctx.lineTo(ray.x+m*ray.dx, ray.y+m*ray.dy);
	ctx.stroke();

	// selRect
	if(selRect!==null){
		ctx.strokeStyle="#f0f";
		ctx.strokeRect(selRect[0], selRect[1], selRect[2]-selRect[0], selRect[3]-selRect[1]);
	}
}// end #draw()


/* Node
   Struktur eines einzelnes Knotens.
   pnt: (Point) Punkt des Knotens 
   dim: Dimension (0=x, 1=y) anhand derer die nächste Unterteilung stattfinden
        soll.
   left: Knoten der in Dimension 'dim' kleiner oder gleich 'pnt' ist.
   right: Knoten der in Dimension 'dim' größer als 'pnt' ist.
*/
function Node(pnt, dim){
	this.pnt=pnt;
	this.dim=dim;
	this.left=null;
	this.right=null;
}// end #Node()


/* treeAdd
   Fügt den Punkt 'pnt' dem Knoten 'node' hinzu. Wenn 'node' nicht angegeben
   wird, wird dem Wurzelelement kdtree hinzugefügt. Wenn kdtree leer ist,
   wird des Wurzelelement mit dem Punkt 'pnt' erzeugt.
*/
function treeAdd(pnt, node){
	if(typeof node==="undefined") node=kdtree;
	if(kdtree===null){
		kdtree=new Node(pnt,0);
		return;
	}

	if(node.dim==0){// test for x
		if(pnt.x<=node.pnt.x){
			if(node.left===null){
				node.left=new Node(pnt,(node.dim+1)%2);
			}else treeAdd(pnt, node.left);
		}else{
			if(node.right===null) node.right=new Node(pnt, (node.dim+1)%2);
			else treeAdd(pnt, node.right);
		}
		return;
	}else if(node.dim==1){
		if(pnt.y<=node.pnt.y){
			if(node.left===null) node.left=new Node(pnt, (node.dim+1)%2);
			else treeAdd(pnt, node.left);
		}else{
			if(node.right===null) node.right=new Node(pnt, (node.dim+1)%2);
			else treeAdd(pnt, node.right);
		}
		return;
	}else{
		console.log("ERROR: node.dim="+node.dim);
		return;
	}
}// end #treeAdd()


/* drawNode()
   Stellt einen Knoten, bzw. seine Unterteilung dar. Rekursiv.
   ctx: 2d-Grafikkontext
   node: Darzustellender Knoten
   rect: [x1,y1,x2,y1] -> Aktueller Rahmen/Wertebereich der durch diesen Knoten
         und seine Unterknoten unterteilt wird.
*/
function drawNode(ctx, node, rect){
	if(typeof ctx==="undefined") return;
	if(node===null) return;
	if(typeof node==="undefined") node=kdtree;
	if(typeof rect==="undefined") rect=[0,0,WIDTH,HEIGHT];

	if(node.dim==0){
		ctx.beginPath();
		ctx.moveTo(node.pnt.x, rect[1]);
		ctx.lineTo(node.pnt.x, rect[3]);
		ctx.stroke();
		if(node.left!==null){
			let r=rect.slice();
			r[2]=node.pnt.x;
			drawNode(ctx, node.left, r);
		}
		if(node.right!==null){
			let r=rect.slice();
			r[0]=node.pnt.x;
			drawNode(ctx, node.right, r);
		}
	}else{
		ctx.beginPath();
		ctx.moveTo(rect[0], node.pnt.y);
		ctx.lineTo(rect[2], node.pnt.y);
		ctx.stroke();
		if(node.left!==null){
			let r=rect.slice();
			r[3]=node.pnt.y;
			drawNode(ctx, node.left, r);
		}
		if(node.right!==null){
			let r=rect.slice();
			r[1]=node.pnt.y;
			drawNode(ctx, node.right, r);
		}
	}

	
}// end #drawNode()

function regionClone(region){
	return [region[0].slice(), region[1].slice()];
}

function drawNode2(ctx, node, region){
	if(typeof node==="undefined") node=testTree;
	if(typeof region==="undefined") region=[[0,0],[WIDTH,HEIGHT]];
ctx.strokeStyle="rgba(100,100,0,0.5)";
	if(node.dim==0){
		ctx.beginPath();
		ctx.moveTo(node.pnt[0], region[0][1]);
		ctx.lineTo(node.pnt[0], region[1][1]);
		ctx.stroke();
		if(node.nodes[0]!==null){
			let r=regionClone(region);
			r[1][0]=node.pnt[0];
			drawNode2(ctx, node.nodes[0], r);
		}
		if(node.nodes[1]!==null){
			let r=regionClone(region);
			r[0][0]=node.pnt[0];
			drawNode2(ctx, node.nodes[1], r);
		}
	}else{
		ctx.beginPath();
		ctx.moveTo(region[0][0], node.pnt[1]);
		ctx.lineTo(region[1][0], node.pnt[1]);
		ctx.stroke();
		if(node.nodes[0]!==null){
			let r=regionClone(region);
			r[1][1]=node.pnt[1];
			drawNode2(ctx, node.nodes[0], r);
		}
		if(node.nodes[1]!==null){
			let r=regionClone(region);
			r[0][1]=node.pnt[1];
			drawNode2(ctx, node.nodes[1], r);
		}
	}
}// end #drawNode2()


/* treeFindNearest()
Findet den Knoten, welcher 'x'/'y' am nächsten ist und speichert den
betreffenden Knoten in 'selectedPoint', zusammen mit dessen Entfernung.

x: X-Koordinate des zu suchenden Wertes
y: Y-Koordinate des zu suchenden Wertes
node: Knoten bei dem mit der Suche begonnen werden soll. Wenn nicht
      angegeben, wird die Wurzel von 'kdtree' benutzt.
nearest: Bisher kürzester Abstand. Wenn nicht angegeben, wird die Diagonale
         als kürzester Wert angennommen.
return: kürzeste gefundene Entfernung
*/
function treeFindNearest(x,y,node,nearest){
	if(typeof node==="undefined") node=kdtree;
	if(node===null) return nearest;
	if(typeof nearest==="undefined") nearest=Math.sqrt(WIDTH*WIDTH, HEIGHT*HEIGHT);

	let dx=Math.abs(x-node.pnt.x);
	let dy=Math.abs(y-node.pnt.y)

	let dist=Math.pow(x-node.pnt.x,2)+Math.pow(y-node.pnt.y,2);
	dist=Math.sqrt(dist);

	if(dist<nearest){
		nearest=dist;
		selectedPoint.point=node.pnt;
		selectedPoint.radius=nearest;
	}

	if(node.dim==0){
		//if(x>node.pnt.x) treeFindNearest(x,y, node.right, nearest);
		//else treeFindNearest(x,y, node.left, nearest);
		if(x+nearest>node.pnt.x) nearest=treeFindNearest(x,y, node.right, nearest);
		if(x-nearest<=node.pnt.x) nearest=treeFindNearest(x,y, node.left, nearest);
	}else{
		//if(y>node.pnt.y) treeFindNearest(x,y, node.right, nearest);
		//else treeFindNearest(x,y, node.left, nearest);
		if(y+nearest>node.pnt.y) nearest=treeFindNearest(x,y, node.right, nearest);
		if(y-nearest<=node.pnt.y) nearest=treeFindNearest(x,y, node.left, nearest);
	}
	return nearest;
}// end treeFindNearest()

// findet den kleinsten X-Wert
function treeFindMinX(node, currentMin){
	if(typeof node==="undefined") node=kdtree;
	if(node===null) return currentMin;
	if(typeof currentMin!=="number") currentMin=node.pnt.x;
	else currentMin=Math.min(node.pnt.x,currentMin);
	if(node.dim==0) return treeFindMinX(node.left, currentMin);
	currentMin=treeFindMinX(node.left, currentMin);
	currentMin=treeFindMinX(node.right, currentMin);
	return currentMin;
}// end #treeFindMinX()


/* Findet den Bereich, in dem 'x'/'y' liegt und gibt diesen als Knoten und Rechteck zurück.

*/
function treeFindRegion(x,y,node,rect){
	if(typeof node==="undefined") node=kdtree;
	if(typeof rect==="undefined") rect=[0,0,WIDTH-1,HEIGHT-1];
	let ret=[node,rect];

	if(x==node.pnt.x && y==node.pnt.y) return ret; // <-?
	
	if(node.dim==0){
		if(x>node.pnt.x){
			rect[0]=node.pnt.x;
			if(node.right===null) return ret;
			ret=treeFindRegion(x,y,node.right,rect);
		}else{
			rect[2]=node.pnt.x;
			if(node.left===null) return ret;
			ret=treeFindRegion(x,y,node.left, rect);
		}
	}else{
		if(y>node.pnt.y){
			rect[1]=node.pnt.y;
			if(node.right===null) return ret;
			ret=treeFindRegion(x,y, node.right, rect);
		}else{
			rect[3]=node.pnt.y;
			if(node.left===null) return ret;
			ret=treeFindRegion(x,y, node.left, rect);
		}
	}
	
	return ret;
}// end #treeFindRegion()

/*
Findet die Schnittpunkte des Strahls 'ray' mit dem Rechteck 'rect'.
ray: {x,y,dx,dy}
rect: [x1,y1,x2,y2]
return: []: Jedes Element beinhaltet den Abstand 't' und den 'x'/'y' Schnittpunkt, also [t,x,y]
	[
		[t1,x1,y1]
		[t2,x2,y2],
		...
	]
*/
function rayRectIntersection(ray, rect){
	let t,x,y;
	let hits=[];
	//ray.x+t*ray.dx=rect[0]
	if(ray.dx==0 && ray.dy==0) return hits;
	// horizontale Kanten testen
	if(ray.dx!=0){
		t=(rect[0]-ray.x)/ray.dx;
		y=ray.y+t*ray.dy;
		if(y>=rect[1] && y<=rect[3]) hits.push([t,rect[0],y]);
		
		t=(rect[2]-ray.x)/ray.dx;
		y=ray.y+t*ray.dy;
		if(y>=rect[1] && y<=rect[3]) hits.push([t,rect[2],y]);
	}else{
		if(ray.x>=rect[0] && ray.x<=rect[2]){
			//ray.y+t*ray.dy=rect[1]
			t=(rect[1]-ray.y)/ray.dy;
			hits.push([t, ray.x, rect[1]]);
			t=(rect[3]-ray.y)/ray.dy;
			hits.push([t, ray.x, rect[3]]);
		}
	}
	// vertikale Kanten testen
	if(ray.dy!=0){
		t=(rect[1]-ray.y)/ray.dy;
		x=ray.x+t*ray.dx;
		if(x>=rect[0] && x<=rect[2]) hits.push([t,x,rect[1]]);

		t=(rect[3]-ray.y)/ray.dy;
		x=ray.x+t*ray.dx;
		if(x>=rect[0] && x<=rect[2]) hits.push([t,x,rect[3]]);
	}else{
		if(ray.y>=rect[1] && ray.y<=rect[3]){
			t=(rect[0]-ray.x)/ray.dx;
			hits.push([t, rect[0], ray.y]);
			t=(rect[2]-ray.x)/ray.dx;
			hits.push([t, rect[2], ray.y]);
		}
	}

	hits.sort((a,b)=>a[0]-b[0]);

	return hits;
}// end #rayRectIntersection()


