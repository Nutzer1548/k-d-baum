"use strict";

function Point(x,y){
	this.x=x;
	this.y=y;
	this.toString=function(){
		return "P["+x+","+y+"]";
	}
}// end #Point()

let WIDTH=512;
let HEIGHT=512;
let points=[];

let kdtree=null;
let crossPath=null;

let selectedPoint={
	point: null,
	radius: 10
};

function init(){
	// create points
	points=[];
	for(let i=0; i<15; i++){
		let x=Math.random()*WIDTH;
		let y=Math.random()*HEIGHT;
		x=Number.parseInt(x);
		y=Number.parseInt(y);
		points.push(new Point(x,y));
	}
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
		selectedPoint.point=new Point(x,y);
		draw();
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

	if(selectedPoint.point!==null){
		ctx.strokeStyle="rgba(255,0,0,0.75)";
		ctx.beginPath();
		let p=selectedPoint.point;
		ctx.arc(p.x, p.y, selectedPoint.radius, 0, 2*Math.PI);
		ctx.stroke();
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


/* treeFindNearest()
   Findest den Knoten, welcher 'x'/'y' am nächsten ist und speichert den
   betreffenden Knoten in 'selectedPoint', zusammen mit dessen Entfernung.
   x: X-Koordinate des zu suchenden Wertes
   y: Y-Koordinate des zu suchenden Wertes
   node: Knoten bei dem mit der Suche begonnen werden soll. Wenn nicht
         angegeben, wird die Wurzel von 'kdtree' benutzt.
   nearest: Bisher kürzester Abstand. Wenn nicht angegeben, wird die Diagonale
            als kürzester Wert angennommen.
*/
function treeFindNearest(x,y,node,nearest){
	if(typeof node==="undefined") node=kdtree;
	if(node===null) return;
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
		if(x>node.pnt.x) treeFindNearest(x,y, node.right, nearest);
		else treeFindNearest(x,y, node.left, nearest);
	}else{
		if(y>node.pnt.y) treeFindNearest(x,y, node.right, nearest);
		else treeFindNearest(x,y, node.left, nearest);
	}

}// end treeFindNearest()

