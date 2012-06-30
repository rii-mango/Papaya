
/*
 * Copyright (c) 2012, RII-UTHSCSA
 * All rights reserved.

 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the 
 * following conditions are met:
 *
 *	- Redistributions of source code must retain the above copyright notice, this list of conditions and the following 
 *		disclaimer.
 *
 *	- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the 
 *		following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 *	- Neither the name of the RII-UTHSCSA nor the names of its contributors may be used to endorse or promote products 
 *		derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
 * INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR 
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, 
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE 
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


/**
 * @classDescription	A VoxelDimensions class stores voxel size information.
 */
var papaya = papaya || {};
papaya.volume = papaya.volume || {};


/**
 * Constructor.
 * @param colSize {Numeric}	The size of the column.
 * @param rowSize {Numeric} The size of the row.
 * @param sliceSize {Numeric}	The size of the slice.
 * @param timeSize {Numeric}	The duration that the image represents.
 */
papaya.volume.VoxelDimensions = papaya.volume.VoxelDimensions || function(colSize, rowSize, sliceSize, timeSize) {
	// Public properties
	this.colSize = Math.abs(colSize);
	this.rowSize = Math.abs(rowSize);
	this.sliceSize = Math.abs(sliceSize);
	this.xSize; this.ySize; this.zSize;
	this.timeSize = timeSize;	
}


/**
 * Tests wheter this object has a valid state.
 * @return {Boolean}	true if state is valid
 */
papaya.volume.VoxelDimensions.prototype.isValid = function() {
	return ((this.colSize > 0) && (this.rowSize > 0) && (this.sliceSize > 0) && (this.timeSize >= 0));
}