"use strict";
/*
functions for testing kdtree.js
call "Test.everything()" for a complete test.

everything() tests:
- adding many multidimensional points
- finding every point
- uniforme dimension splits (splitting axis is (current_dim+1)%max_dim from one node to its child)
*/

let Test={
	errorsFound:0, // errors found so far
	points:[], // points to store in the tree
	tree:null, // KDTree

	/* adds point in a tree and tries to find them afterwards */
	add:function(){
		//console.log("Test.add() --- start");

		let points=this.points;
		let dim=this.points[0].length;
		let numMax=points.length;

		// create tree from points
		this.tree=new KDTree(points[0]);
		for(let num=1; num<numMax; num++){
			let ret=this.tree.add(points[num]);
			if(typeof ret!=="object"){
				this.errorsFound++;
				console.log("tree.add(): wrong return-type: "+(typeof ret)+" (point: "+points[num]+")");
			}
			// test inserted point
			for(let d=0; d<dim; d++){
				if(ret.pnt[d]==points[num][d]) continue;
				this.errorsFound++;
				console.log('tree.add(): return node represents wrong point.');
			}
		}// end for num

		// tests if every point is in tree
		for(let num=0; num<numMax; num++){
			let node, root;
			[node, root]=this.tree.getNode(points[num]);
			if(node===null){
				if(num==0) node=root;
				else{
					console.log("tree.add(): point["+num+"]="+points[num]+" not found in tree");
					this.errorsFound++;
					continue;
				}
			}
			if(!this.tree.pointEqual(node.pnt, points[num])){
				if(num==0) continue;
				console.log("tree.add(): .getNode() for point["+num+"]="+point[num]+", returns wrong node with point "+node.pnt);
			}

		}// end for num

		//console.log("Test.add() --- end");
	},// end #add()

	/* creates points for testing the tree with */
	createPoints:function(dimensions, maxPoints){
		if(typeof dimensions==="undefined") dimensions=3;
		if(typeof maxPoints==="undefined") maxPoints=200;

// DB:
/*this.points=JSON.parse("[[39,96,37],[50,97,40],[18,1,69],[69,96,13],[0,20,80],[26,29,79],[72,67,69],[14,95,97],[22,70,97],[6,57,20]]");
if(true)return; // */
		// create points
		let dim=dimensions; // dimensions for points
		let numMax=maxPoints; // points to create
		let points=Array(numMax);
		for(let num=0; num<numMax; num++){
			let pnt=Array(dim);
//			for(let d=0; d<dim; d++) pnt[d]=Math.random();
			for(let d=0; d<dim; d++) pnt[d]=Number.parseInt(Math.random()*100);
			points[num]=pnt;
		}
		this.points=points;
	},// end #createPoints()
	
	/* runs all tests available in meaningful order*/
	everthing:function(){
		this.errorsFound=0;
		console.log("Testing everything:");
		this.createPoints(3,1000);
		this.add();
		this.structure();
		this.uniformDimensions();
		this.minMax();
		this.remove(); 
		console.log("Done with everything. Errors found: "+this.errorsFound);
	},// end everything()


	/* test tree building */
	testBuilding:function(dimensions, pointCount, loops){
		if(typeof dimensions==="undefined") dimensions=3;
		if(typeof pointCount==="undefined") pointCount=1000;
		if(typeof loops==="undefined") loops=50;
		this.errorsFound=0;
		console.log("Testing tree building:");
		for(let l=0; l<loops; l++){
			this.createPoints(dimensions, pointCount);
			this.add();
			this.structure();
			this.uniformDimensions();
			this.minMax();
		}// end for l
		this.createPoints(dimensions, pointCount,);
		console.log("Test done. Errors found: "+this.errorsFound);
	},// end #testBuilding()


	/* tests for correctly alterd splitting dimension */
	uniformDimensions:function(node){
		if(typeof node==="undefined") node=this.tree;
		if(node===null) return;
		let dim=this.points[0].length;
		if(node.nodes[0]!==null){
			if( (node.dim+1)%dim != node.nodes[0].dim ){
				console.log("uniformDimensions: dimension jumped from "+node.dim+" at point "+node.pnt+"  (parent) to "+
 			                 node.nodes[0].dim+" at point "+node.nodes[0].pnt+" (left child)");
				this.errorsFound++;
			}
			this.uniformDimensions(node.nodes[0])
		}
		if(node.nodes[1]!==null){
			if( (node.dim+1)%dim != node.nodes[1].dim ){
				console.log("uniformDimensions: dimension jumped from "+node.dim+" at point "+node.pnt+"  (parent) to "+
 			                 node.nodes[1].dim+" at point "+node.nodes[1].pnt+" (right child)");
				this.errorsFound++;
			}
			this.uniformDimensions(node.nodes[1]);
		}
	},// end #uniformDimensions()

	/* tests internal structure of 'tree'
	-> tests if every child is placed on the correct side.
	*/
	structure:function(root){
		if(typeof root==="undefined") root=Test.tree;

		if(root.nodes[0]!==null){
			if(root.nodes[0].pnt[root.dim]>root.pnt[root.dim]){
				this.errorsFound++;
				console.log("structure(): child not correctly positioned!\n'-> dim="+root.dim+" | root:"+root.pnt+" | nodes[0]:"+root.nodes[0].pnt);
			}
			this.structure(root.nodes[0]);
		}
		if(root.nodes[1]!==null){
			if(root.nodes[1].pnt[root.dim]<=root.pnt[root.dim]){
				this.errorsFound++;
				console.log("structure(): child not correctly positioned!\n'-> dim="+root.dim+" | root:"+root.pnt+" | nodes[1]:"+root.nodes[1].pnt);
			}
			this.structure(root.nodes[1]);
		}
		
	},// end #structure

	/* tests tree.nodeMin/.nodeMax */
	minMax:function(){
		//console.log("Test.minMax -- start");
		let node, root;
		[node, root]=this.tree.nodeMin(0);
		let pointMin, pointMax;

		let dim=this.points[0].length;

		for(let d=0; d<dim; d++){
			// get real min/max
			pointMin=this.points[0];
			pointMax=this.points[0];
			for(let i=1; i<this.points.length; i++){
				let p=this.points[i];
				if(p[d]<pointMin[d]) pointMin=p;
				if(p[d]>pointMax[d]) pointMax=p;
			}// end for i
			// compare with .tree results
			[node, root]=this.tree.nodeMin(d);
			//if(!this.tree.pointEqual(node.pnt, pointMin)){
			if(pointMin[d]>node.pnt[d]){
				this.errorsFound++;
				console.log("minMax(): minimum in dimension "+d+" should be "+pointMin+" but returned was "+node.pnt);
			}
			[node, root]=this.tree.nodeMax(d);
			//if(!this.tree.pointEqual(node.pnt, pointMax)){
			if(pointMax[d]<node.pnt){
				this.errorsFound++;
				console.log("minMax(): maximum in dimension "+d+" should be "+pointMax+" but returned was "+node.pnt);
			}
		}// end for d
		//console.log("Test.minMax -- end");
	},// end #minMax()
	
	/* tests removal of points */
db_toRemove:[],
	remove:function(){
		let pointsToRemoveMax=Number.parseInt(this.points.length*0.02);
pointsToRemoveMax=1;
		let pointsToRemove=Array(pointsToRemoveMax);
this.db_toRemove=pointsToRemove;
console.log("db: removing "+pointsToRemoveMax+" points")
		for(let i=0; i<pointsToRemoveMax; i++){
			let idx;
			do{
				idx=Number.parseInt(Math.random()*(this.points.length-1))+1;
			}while(pointsToRemove.indexOf(idx)>=0);
			pointsToRemove[i]=idx;
		}

		for(let i=0; i<pointsToRemoveMax; i++){
			let p=this.points[pointsToRemove[i]];
//console.log("i="+i+" "+p);
			let ret=this.tree.removePoint(p);
			if(ret!==true){
				console.log("remove(): can't remove point "+p+" (global idx "+pointsToRemove[i]+", local idx "+i+")");
				this.errorsFound++;
			}
		}

		// tests if every point that should be in tree is there
		// and every point that should not, is not
		for(let num=0; num<this.points.length; num++){
			// is point found in tree?
			let node, root;
			[node, root]=this.tree.getNode(this.points[num]);
			let found=true;
			if(node===null){
				if(this.tree.pointEqual(this.points[num])){
					// root-node
					found=true;
				}else found=false;
			}

			// is that result expected?
			if(pointsToRemove.indexOf(num)>=0){
				if(found){
					this.errorsFound++;
					console.log("point "+this.points[num]+" should have been removed, but is still there!");
				}
			}else if(!found){
				this.errorsFound++;
				console.log("point "+this.points[num]+" is missing!");
			}


		}// end for num
	},// end #remove()

	

	dummy:0
};
