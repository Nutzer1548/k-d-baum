"use strict";
/* kdtree.js
Object to bild an k-d-tree and operate on it.
It kann add, remove and search points.
A "point" in this tree is an array of numbers, where each index represents a distinct dimension.

Main-Object: KDTree
.add(point): adds 'point' to tree
.nodeMin(dim): returns [node, parent] -> smallest node with parent
.nodeMax(dim): returns [node, parent] -> biggest node with parent
.findNearestPoint(point, minDist): finds that point in tree, thats nearest to 'point' 
.findRegion(point, region): finds smallest region inside 'region' that contains 'point'
.getNode(point): returns [node, parent] -> node that belongs to point.
.isLeaf(): 'true' if thir node has no child nodes
.removePoint(point): removes point _below_ this node

(the following functions are 'static' as they do not access/need any tree-data)
.minNode(dim,...nodes): finds node with smallest value in dimension 'dim'
.maxNode(dim,...nodes): finds node with highest value in dimension 'dim'
.pointDistance(p1,p2): returns distance of 2 points
.pointEqual(p1,p2); returns true, if 'p1' and 'p2' are equal in every component.
.rayRegionIntersection(ray, region); returns intersections of 'ray' with region

*/

/* KDTree(point, dimension,)
Creates a new k-d-tree(-node).
point: []: the point coordinates
dimension: the index of the dimension to decide child node insertion. if not defined: 0

*/
function KDTree(point, dimension){
	if(typeof dimension==="undefined") dimension=0;

	this.pnt=point;
	this.dim=dimension; // the dimension of splitting / aka. depth
	this.nodes=[null,null]; // child nodes: nodes[0]=smaller or equal, nodes[1]=greater

	/*
	adds a new point to the current node
	return: the newly created node which represent 'point'.
	*/
	this.add=function(point){
		if(this.pnt.length!=point.length){// dimension mismatch
			console.log("Error: Dimension mismatch!");
			return null; 
		}
		let nodeIdx=0;
		if(point[this.dim]>this.pnt[this.dim]) nodeIdx=1;
		if(this.nodes[nodeIdx]==null) this.nodes[nodeIdx]=new KDTree(point, (this.dim+1)%this.pnt.length);
		else return this.nodes[nodeIdx].add( point);//, (  this.dim+1)%point.length);
		return this.nodes[nodeIdx];
	};// end #add();

	/*
	finds the point in this KDTree, that's nearest to point 'point'
	point: point to approach to
	minDist: initial distance to be beaten. If undefined, set to Number.MAX_VALUE
	return: [point_in_tree, distance]
	*/
	this.findNearestPoint=function(point, minDist){
		if(typeof minDist==="undefined") minDist=Number.MAX_VALUE;

		let dist=this.pointDistance(this.pnt, point);
		let pit=null;
		let pit2=null;
		if(dist<minDist){
			pit=this.pnt;
			minDist=dist;
		}

		if(this.nodes[1]!==null){
			if(point[this.dim]+minDist > this.pnt[this.dim]) [pit2,minDist]=this.nodes[1].findNearestPoint(point,minDist);
			if(pit2!==null) pit=pit2;
		}
		if(this.nodes[0]!==null){
			if(point[this.dim]-minDist <= this.pnt[this.dim]) [pit2, minDist]=this.nodes[0].findNearestPoint(point, minDist);
			if(pit2!==null) pit=pit2;
		}

		return [pit, minDist];
	};// end #findNearestPoint()


	/* returns the distance between two points
	*/
	this.pointDistance=function(pnt1, pnt2){
		if(pnt1.length!=pnt2.length){
			console.log('dimension mismatch');
			return Number.MAX_VALUE;
		}
		let sum=0;
		for(let i=0; i<pnt1.length; i++){
			let p=pnt1[i]-pnt2[i];
			sum+=p*p;
		}
		return Math.sqrt(sum);
	};// end #pointDistance()

	/*
	returns the node with the smallest value in dimension 'dimension'
	*/
	this.minNode=function(dimension, ...nodes){
		let n=0;
		for(let i=1; i<nodes.length; i++) if(nodes[i][dimension]<nodes[n][dimension]) n=i;
		return nodes[n];
	};

	/*
	returns the nodes with the highest value in dimension 'dimension'
	*/
	this.maxNode=function(dimension, ...nodes){
		let n=0;
		for(let i=1; i<nodes.length; i++) if(nodes[i][dimension]>nodes[n][dimension]) n=i;
		return nodes[n];
	};



	/*
	returns the node with the smallest value _below_ this node along 'dimension'
	and returns it and its parent. 
	return: [node, parent]: smallest 'node' below this one and its 'parent'.
	        [node, null], if there is no smaller node along dimension than this one.
	*/
	this.nodeMin=function(dimension, root){
		if(typeof root==="undefined") root=null;
		if(this.dim==dimension){
			if(this.nodes[0]===null) return [this, root];
			return this.nodes[0].nodeMin(dimension, this);
		}

		if(this.isLeaf()) return [this, root];

		let minA=null, minAroot=null;
		let minB=null, minBroot=null;
		if(this.nodes[0]!==null){
			[minA, minAroot]=this.nodes[0].nodeMin(dimension, this);
		}
		if(this.nodes[1]!==null){
			[minB, minBroot]=this.nodes[1].nodeMin(dimension, this);
		}

		if(minB===null){// -> compare 'minA' with 'this'
			if(this.pnt[dimension]<=minA.pnt[dimension]) return [this, root];
			return [minA, minAroot];
		}
		if(minA===null){// -> compare 'minB' with 'this'
			if(this.pnt[dimension]<=minB.pnt[dimension]) return [this, root];
			return [minB, minBroot];
		}

		if(minB.pnt[dimension]<minA.pnt[dimension]){
			minA=minB;
			minAroot=minBroot;
		}
		
		if(this.pnt[dimension]<=minA.pnt[dimension]) return [this,root];
		return [minA, minAroot];
	};//end #nodeMin()

	/*
	Like nodeMin(), but finds the node with the highest value
	*/
	this.nodeMax=function(dimension, root ){
		if(typeof root==="undefined") root=null;
		if(this.dim==dimension){
			if(this.nodes[1]===null) return [this, root];
			return this.nodes[1].nodeMax(dimension, this);
		}
		
		if(this.isLeaf()) return [this, root];

		let maxA=null, maxAroot=null;
		let maxB=null, maxBroot=null;
		if(this.nodes[0]!==null){
			[maxA, maxAroot]=this.nodes[0].nodeMax(dimension, this);
		}
		if(this.nodes[1]!==null){
			[maxB, maxBroot]=this.nodes[1].nodeMax(dimension, this);
		}

		if(maxB===null){
			if(this.pnt[dimension]>=maxA.pnt[dimension]) return [this, root];
			return [maxA, maxAroot];
		}else if(maxA===null){
			if(this.pnt[dimension]>=maxB.pnt[dimension]) return [this, root];
			return [maxB, maxBroot];
		}

		if(maxB.pnt[dimension]>maxA.pnt[dimension]){
			maxA=maxB;
			maxAroot=maxBroot;
		}

		if(this.pnt[dimension]>=maxA.pnt[dimension]) return [this,root];
		return [maxA, maxAroot];
	};// end #nodeMax()


	/*
	Finds the smalles region that contains 'point'
	point: Point to locate region for
	region: [ lowerPoint, upperPoint]: starting-region. If not defined, set to
	        maximum possible range (Number.MIN_VALUE to Number.MAX_VALUE)
	return: the located region
	*/
	this.findRegion=function(point, region){
		if(typeof region==="undefined") region=[Array(point.length).fill(Number.MIN_VALUE), Array(point.length).fill(Number.MAX_VALUE)];
		let nodeIdx=0;
		if(point[this.dim]>this.pnt[this.dim]) nodeIdx=1;
		region[1-nodeIdx][this.dim]=this.pnt[this.dim]; 
		if(this.nodes[nodeIdx]!==null) region=this.nodes[nodeIdx].findRegion(point, region);

		return region;
	};// end #findRegion()


	/* rayRegionIntersection(ray, region)
	Finds intersections of 'ray' with 'region'. That are entry and exit-points,
	if they exist), and returns the distance and the actual point.
	ray: [ startPoint, direction]: expects 'direction' to be normalized,
	     otherwise the returnd distance will be scaled by the length of
		 'direction'
	region: [ lowerPoint, upperPoint ]: the region to test intersection on.
	return: [ [distance1, point1], [distance2, point2]]:
	       'distance' is choosen to match ray[0]+distance*ray[1]=point.
		   The number of Elements return depends on the actual number of number
		   of hit points.
	*/
	this.rayRegionIntersection=function(ray, region){
		let hits=[];

		let tmin=Number.MIN_VALUE, tmax=Number.MAX_VALUE;

		let p=Array(ray[0].dim).fill(0); // partial potential hit-point
		for(let dim=0; dim<ray[0].length; dim++){
			if(ray[1][dim]==0){
				if(ray[0][dim]<region[0][dim] || ray[0][dim]>region[1][dim]) return [];
				continue;
			}
			//ray[0][dim]+t*ray[1][dim]=region[0][dim]
			let t0=(region[0][dim]-ray[0][dim])/ray[1][dim];
			let t1=(region[1][dim]-ray[0][dim])/ray[1][dim];
			if(t1<tmin || t0>tmax) return [];
			tmin=Math.max(tmin, t0);
			tmax=Math.min(tmax, t1);
		}// end for dim

		if(tmax<tmin) return [];

		let p0=Array(ray[0].length).fill(0);
		let p1=Array(ray[0].length).fill(0);
		for(let dim=0; dim<ray[0].length; dim++){
			p0[dim]=ray[0][dim]+tmin*ray[1][dim];
			p1[dim]=ray[0][dim]+tmax*ray[1][dim];
		}// end for dim

		return [
			[tmin, p0],
			[tmax, p1]
		];

	};// end #rayRegionIntersection()

	/*
	return: true, if this node has no child nodes. false, otherwise
	*/
	this.isLeaf=function(){
		return this.nodes[0]===null && this.nodes[1]===null;
	};// end #isLeaf()


	/*
	removes 'point' from this tree.
	return: true if successful, false otherwise
	*/
	this.removePoint=function(point){
		let node, nodeRoot;
		[node, nodeRoot]=this.getNode(point);
		if(node===null) return false; // point not found
		if(node.isLeaf()){ // remove link from parent and return
			nodeRoot.nodes[node.pnt[nodeRoot.dim]>nodeRoot.pnt[nodeRoot.dim]?1:0]=null;
			return true;
		}

		if(node.nodes[1]!==null){
			let min,minRoot;
			[min, minRoot]=node.nodeMin(node.dim);
			if(minRoot===null){ // => min=node => minRoot=nodeRoot
				minRoot=nodeRoot;
			}
			node.pnt=min.pnt.slice();
			return minRoot.removePoint(node.pnt);
		}

		if(node.nodes[0]!==null){
			let max, maxRoot;
			[max, maxRoot]=node.nodeMax(node.dim);
			if(maxRoot===null) maxRoot=nodeRoot;
			node.pnt=max.pnt.slice();
			return maxRoot.removePoint(node.pnt);
		}
	};// end #removePoint()

	/*
	tests if 2 points are equal
	if 'p2' is undefined, the current point is assumed
	return: true, if the points are equal in every component
	*/
	this.pointEqual=function(p1,p2){
		if(typeof p2==="undefined") p2=this.pnt;
		if(p1.length!=p2.length){
			console.log("dimension mismatch");
			return false;
		}
		for(let i=0; i<p1.length; i++) if(p1[i]!=p2[i]) return false;
		return true;
	};// end #pointEqual()

	/*
	Searches for 'point' _below_ this tree
	return: [node, parent]: the 'node' representing 'point' and that nodes direct parent.
	        If 'point' is not found, returns [null, parent], where 'parent' is
			the node which should have been parent for 'point'.
	*/
	this.getNode=function(point){
		let nodeIdx=(point[this.dim]>this.pnt[this.dim])?1:0;
		if(this.nodes[nodeIdx]===null) return [null, this]; // not found, but this node could have been its parent
		if(this.nodes[nodeIdx].pointEqual(point)) return [this.nodes[nodeIdx], this]; // found
		//if(this.pointEqual(this.nodes[nodeIdx].pnt,point)) return [this.nodes[nodeIdx], this]; // found
		return this.nodes[nodeIdx].getNode(point, this); // search deeper
	};// end #getNode()



}// end KDTree()

