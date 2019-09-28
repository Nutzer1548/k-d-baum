"use strict";
/* functions for testing kdtree.js
short:
call "Test.everything(7,10000)" for a complete test over 7 dimensions with 10000 points.
Every Test will log the errors found to the console.

Base Object: Test

Fields:
-------
.errorsFound: count of errors found
.points: [] the points, that will be in the kdtree
.tree: the kdtree object the tests work on

Functions:
----------
.add(): adds the points in the 'points' field to tbhe kdtree and ensures they are there
.findMissingPoints(): returns points in '.points' that are not in '.tree'
.createPoints(dim,cnt): fills '.points' with 'cnt' random points with 'dim' dimensions
.everything(dim,cnt): runs all tests using 'cnt' points with 'dim' dimensions
.nearestPoint(): tests finding of nearest Point in Tree
.testBuilding(dim,cnt,loop): tests insertion of 'cnt' points with dimension 'dim', 'loop' times
.uniformDimensions(node): tests 'node' and its children for alternating splitting dimension.
.structure(node): tests if children of 'node' are placed on the correct side.
.minMax(): tests if .tree.nodeMin()/.nodeMax() returns correct values
.remove(): tests removal of points

*/

let Test={
	errorsFound:0, // errors found so far
	points:[], // points to store in the tree
	tree:null, // KDTree

	/*
	adds point in a tree and tries to find them afterwards
	balaned: if true, a balanced tree will be created. defaults to true
	*/
	add:function(balanced){
		if(typeof balanced==="undefined") balanced=true;
		//console.log("Test.add() --- start");

		let points=this.points;
		let dim=this.points[0].length;
		let numMax=points.length;

		// create tree from points
		if(balanced){
			this.tree=KDTree.createBalanced(this.points);
		}else{
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
		}

		// tests if every point is in tree
		for(let num=0; num<numMax; num++){
			let node, root;
			[node, root]=this.tree.getNode(points[num]);
			if(node===null){
				if(this.tree.pointEqual(points[num])){ // point is root node
					continue;
				}
				console.log("tree.add(): point["+num+"]="+points[num]+" not found in tree");
				this.errorsFound++;
				continue;
			}
			if(!this.tree.pointEqual(node.pnt, points[num])){
				if(num==0) continue;
				console.log("tree.add(): .getNode() for point["+num+"]="+point[num]+", returns wrong node with point "+node.pnt);
			}

		}// end for num
	},// end #add()

	/*
	Checks if every point in 'points' is in the tree.
	Returns the missing Points
	*/
	findMissingPoints:function(){
		let ret=[];
		for(let i=0; i<this.points.length; i++){
			let node, nodeRoot;
			if(i==0){
				if(!this.tree.pointEqual(this.points[i])) ret.push(this.points[0]);
				continue;
			}
			[node, nodeRoot]=this.tree.getNode(this.points[i]);
			if(node===null) ret.push(this.points[i]);
		}
		return ret;
	},// end #findMissingPoints()

	/*
	creates unique points for testing the tree with
	*/
	createPoints:function(dimensions, maxPoints){
		if(typeof dimensions==="undefined") dimensions=3;
		if(typeof maxPoints==="undefined") maxPoints=200;
		let dimRange=100;
		let minDimRange=Math.pow(maxPoints, 1/(dimensions-0.5));
		if(minDimRange>dimRange){
			dimRange=Math.pow(10, Math.floor(Math.log10(minDimRange)+1));
			/*console.log("Room for unique point generation is a little narrow for creating "+maxPoints+
						" points in the range of 0-100.\n'- adjusting range to 0-"+dimRange+" instead!"); // */
		}

		// create points
		let dim=dimensions; // dimensions for points
		let numMax=maxPoints; // points to create
		let points=Array(numMax);
		for(let num=0; num<numMax; num++){
			let pnt=Array(dim);
			let matches;
			do{
//				for(let d=0; d<dim; d++) pnt[d]=Math.random();
				for(let d=0; d<dim; d++) pnt[d]=Number.parseInt(Math.random()*dimRange);
				matches=false;
				for(let i=0; i<num && matches<dim; i++){
					matches=0;
					for(let d=0; d<dim; d++)
						if(points[i][d]==pnt[d]) matches++;
				}

			}while(matches>=dim);// repeat while point already exists
			points[num]=pnt;
		}
		this.points=points;
	},// end #createPoints()
	
	/* runs all tests available in meaningful order
	dimensions: dimensions to simulate. defaults to 3
	pointCount: the amount of points to create. defaults to 1000
	*/
	everything:function(dimensions, pointCount){
		if(typeof dimensions==="undefined") dimensions=3;
		if(typeof pointCount==="undefined") pointCount=1000;
		this.errorsFound=0;
		console.log("Testing everything:");
		this.createPoints(dimensions, pointCount);
		this.add();
		this.structure();
		this.uniformDimensions();
		this.minMax();
		this.nearestPoint();
		this.remove(); 
		console.log("Done with everything. Errors found: "+this.errorsFound);
	},// end everything()


	/* test tree building
	dimensions: dimensions to simulate. defaults to 3
	pointCount: the amount of points to create. defaults to 1000
	loops: the complete test is repeated 'loops' times. defaults to 50.
	*/
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
	return: the count of errors found.
	*/
	structure:function(root){
		if(typeof root==="undefined") root=Test.tree;
		let err=0;

		if(root.nodes[0]!==null){
			if(root.nodes[0].pnt[root.dim]>root.pnt[root.dim]){
				this.errorsFound++;
				console.log("structure(): child not correctly positioned!\n'-> dim="+root.dim+" | root:"+root.pnt+" | nodes[0]:"+root.nodes[0].pnt);
				err++;
			}
			err+=this.structure(root.nodes[0]);
		}
		if(root.nodes[1]!==null){
			if(root.nodes[1].pnt[root.dim]<=root.pnt[root.dim]){
				this.errorsFound++;
				console.log("structure(): child not correctly positioned!\n'-> dim="+root.dim+" | root:"+root.pnt+" | nodes[1]:"+root.nodes[1].pnt);
				err++;
			}
			err+=this.structure(root.nodes[1]);
		}
		return err;
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
	
	/* tests removal of points
	will remove 2% of the points in .tree and checks if the 'structure()' stays
	correct and every point stays in tree, that is not (yet) removed, and every
	points is gone that should be removed.
	*/
db_toRemove:[],
	remove:function(){
		let pointsToRemoveMax=Number.parseInt(this.points.length*0.02);
		let pointsToRemove=Array(pointsToRemoveMax);
this.db_toRemove=pointsToRemove;
console.log("db: removing "+pointsToRemoveMax+" points")


		for(let i=0; i<pointsToRemoveMax; i++){
			// pick an existing point to remove (by index)
			let idx;
			do{
				idx=Number.parseInt(Math.random()*(this.points.length-1))+1;
			}while(pointsToRemove.indexOf(idx)>=0);
			pointsToRemove[i]=idx; // */

			let p=this.points[idx]; // point to remove
			let ret=this.tree.removePoint(p); // remove
			if(ret!==true){
				this.errorsFound++;
				console.log("remove(): can't remove point "+p+" (global idx "+idx+", local idx "+i+")\n...aborting");
				return;
			}

			if(0!=this.structure()){
				console.log("damaged structure after removal of "+(i+1)+" point(s)\n...aborting");
				return;
			}

			// tests if every point that should be in tree is there
			// and every point that should not, is not
			let err=0;
			for(let num=0; num<this.points.length; num++){
				let node, root, inTree=true;
				[node, root]=this.tree.getNode(this.points[num]);

				if(num==0) inTree=this.tree.pointEqual(this.points[0]);
				else inTree=(node!=null);

				if(pointsToRemove.indexOf(num)>=0){// should be removed
					if(inTree){
						this.errorsFound++;
						console.log("point "+this.points[num]+" should have been removed, but is still there!");
						err++;
					}
				}else if(!inTree){
					this.errorsFound++;
					console.log("point "+this.points[num]+" is missing.");
					err++;
				}
			}// end for num
			if(err>0){
				console.log("'-> Point-Errors: "+err+" [i="+i+", idx="+idx+"].\n...aborting");
				return;
			}
		}// end for i
	},// end #remove()

	/*
	Tests the 'findNearestPoint()' function of KDTree
	*/
	nearestPoint:function(loopMax){
		if(typeof loopMax==="undefined") loopMax=20;
		let dim=this.points[0].length;
		for(let loop=0; loop<loopMax; loop++){
			let pnt=Array(dim);
			for(let d=0; d<dim; d++) pnt[d]=Number.parseInt(Math.random()*100);

			// what the tree sais
			let nearTree, distTree;
			[nearTree, distTree]=this.tree.findNearestPoint(pnt);
			distTree=Math.sqrt(distTree);

			// what it should say
			let nearArr, distArr=Number.MAX_VALUE;
			for(let i=0; i<this.points.length; i++){
				let p=this.points[i];
				let dist=0;
				for(let d=0; d<dim; d++){
					dist+=(p[d]-pnt[d])*(p[d]-pnt[d]);
				}// end for d
				dist=Math.sqrt(dist);
				if(dist<distArr){
					distArr=dist;
					nearArr=p.slice();
				}
			}// end for i

			// same point?
			let samePoint=true;
			for(let d=0; d<dim; d++){
				if(nearArr[d]!=nearTree[d]){
					samePoint=false;
					break;
				}
			}


			// same dist?
			//let sameDist=Math.abs(distTree-distArr)<1e-20;
			let sameDist=Math.abs(distTree-distArr)==0;

			if(!samePoint && !sameDist){
				console.log("nearestPoint | loop "+loop+", pnt="+pnt+": wrong Point!\n Tree: "+nearTree+", dist="+distTree+
				            " --- Should be: "+nearArr+", dist="+distArr);
				this.errorsFound++;
			}

			if(!sameDist){
				console.log("nearestPoint | loop "+loop+", pnt="+pnt+": wrong Distance!\n Tree: "+nearTree+", dist="+distTree+
				            " --- Should be: "+nearArr+", dist="+distArr);
				this.errorsFound++;
			}


		}// end for loop
	},// end #nearestPoint()

	/*
	Tests how balanced 'subtree' is. If one side is off the others by more
	than 1, a message will be displayed.
	originaly wrote to test KDTree.createBalanced(), but since every dublicate
	value in the splitting dimension, there allway will be some unbalances.
	return: count of nodes in subtree including itself
	*/
	isBalanced:function(subtree){
		if(subtree.isLeaf()) return 1;
		let left=0, right=0;
		if(subtree.nodes[0]!==null) left=this.isBalanced(subtree.nodes[0]);
		if(subtree.nodes[1]!==null) right=this.isBalanced(subtree.nodes[1]);


		if(Math.abs(right-left)>1){
			console.log("isBalanced(): unbalanced distribution of "+(right-left));
		}
		return left+right+1;
	},// end #isBalanced()


	/*
	############################################################
	performance tests
	############################################################
	*/

	/* Tests speed of KDTree.add()
	dimensions: dimensions for each point
	pointCount: points to generate
	loops: number of runs to process
	*/
	pfmAdd:function(dimensions, pointCount, loops){
		let times=Array(loops);
		let timeStart, timeEnd;
		this.createPoints(dimensions, pointCount);
		for(let l=0; l<loops; l++){
			timeStart=performance.now();
			this.tree=new KDTree(this.points[0]);
			for(let i=1; i<pointCount; i++) this.tree.add(this.points[i]);
			timeEnd=performance.now();
			times[l]=timeEnd-timeStart;
		}// end for l

		let time=0;
		let timeMin=Number.MAX_VALUE;
		let timeMax=Number.MIN_VALUE;
		for(let t of times){
			if(t<timeMin) timeMin=t;
			if(t>timeMax) timeMax=t;
			time+=t;
		}
		time/=loops;
		console.log("Performance of .add(). "+dimensions+" dimensions, "+pointCount+" points.\n"+
		            "  Median over "+loops+" tries: "+(time/1000)+"s,  best: "+
		            (timeMin/1000)+"s, worst: "+(timeMax/1000)+"s");
	},// end #pfmAdd()

	dummy:0 // <- no meaning, helps not thinking about missing ',' after every not-last entry in an object
};
