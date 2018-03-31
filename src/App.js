import React, { Component } from 'react';
import './bootstrap.min.css';
import './App.css';

class App extends Component {

  constructor(props){
    super(props);
    this.state = {image:null}
    this.uploadBtnHandle = this.uploadBtnHandle.bind(this);
  }

  uploadBtnHandle(evt){
    var imageFile = evt.target.files;
    if (imageFile.length > 0){
      this.setState({image:imageFile[0]});
    }
  }

  render() {
    return (
      <div className="App">
        <div className="header">
          <h1>Picture Puzzle</h1>
          <h2>Upload Image to create a picture puzzle. Drag and drop the pieces to regenerate the image.</h2>
        </div>
        <div className="puzzleBlock">
          <div className="row upBtn"><input type="file" className="btn btn-primary" onChange={this.uploadBtnHandle} defaultValue="New Image" /></div>
          <PuzzleImage image={this.state.image} />
        </div>
      </div>
    );
  }
}

class PuzzleImage extends Component{

  constructor(props){
    super(props);
    this.state = {src:null, width:0, height:0};
    this.maxWidth =parseInt(window.innerWidth*0.4,10);
    this.updateSrc = this.updateSrc.bind(this);
  }

  componentWillReceiveProps(nextProps){

    if(nextProps.image !== this.props.image)
    {
      var readCntrl = new FileReader();
      var updateCallback = this.updateSrc;

      readCntrl.onload = function(){
        updateCallback(readCntrl.result);
      };

      readCntrl.readAsDataURL(nextProps.image);
    }
  }

  updateSrc(data){
    var cv = this.cv.getContext("2d");
    var img = new Image();
    img.src = data;
    img.onload = () => {
      this.cv.width = Math.min(img.width, this.maxWidth);
      this.cv.height = img.height;
      cv.drawImage(img, 0,0, Math.min(img.width, this.maxWidth), img.height);
      this.setState({width:Math.min(img.width, this.maxWidth), height: img.height});
    }
  }

  render(){
    
    return(
      <div className="col-md-12 mt-5">
        <div className="ori float-right justify-content-right"><canvas  ref={(input) => {this.cv = input}}/></div>
        <Puzzle cv={this.cv} w={this.state.width} h={this.state.height} />
      </div>
    );
  }
}

class Puzzle extends Component{

  constructor(props){
    super(props);
    this.state = {piece: [], seq: [], rows:0, cols:0, ws:0, hs:0, dragged: null, answer:[], correct:0, msg:null, resCls:null};
    this.convertImage = this.convertImage.bind(this);
    this.drag = this.drag.bind(this);
    this.drop = this.drop.bind(this);
  }

  componentWillReceiveProps(nextProps){

    if (nextProps.w > 0){
      var cv = nextProps.cv.getContext("2d");
      
      var wstep = Math.floor(nextProps.w*0.25);
      var hstep = Math.floor(nextProps.h*0.25);
      var cuts = [];
      var r = 0;
      var count = 0;
      var pz = [];

      for (var i =0; i< (hstep/0.25); i += hstep){
        for (var j = 0; j < (wstep/0.25); j += wstep)
        {
          var imp = cv.getImageData(j,i, wstep, hstep);
          cuts.push(this.convertImage(imp, wstep, hstep));
          pz.push(count);
          count++;
        }
        r++;
      }
      
      for (var ct = pz.length-1; ct > 0; ct--)
      {
        var index = Math.floor(Math.random() * (ct+1));
        var t = pz[ct];
        pz[ct] = pz[index];
        pz[index] = t;
        
      } 

      this.setState({piece: cuts, seq:pz, rows: r, cols: parseInt(cuts.length/r,10), ws: wstep, hs:hstep});
      
    }
  }

  convertImage(data,w,h){

    this.cv.width = w;
    this.cv.height = h;
    var xt = this.cv.getContext("2d");
    xt.putImageData(data,0,0);
    return this.cv.toDataURL();
  }

  drag(e){
    this.setState({dragged:e});
  }

  drop(e,id){
    var p = e.target.getContext("2d");
    var dragImage = new Image();
    dragImage.src = this.state.piece[this.state.dragged];
    dragImage.onload = () => {
      p.drawImage(dragImage,0,0);  
    }
    var c = 0;

    if (id === this.state.dragged)
      c = 1;
    this.setState((pre) => ({dragged: null, answer: pre.answer.concat(pre.dragged), correct: pre.correct+c}));
    
    if (this.state.piece.length-1 === this.state.answer.length){
      if (this.state.correct+c === this.state.piece.length)
        this.setState({msg:"Congragulations", resCls:"pass"});
      else
        this.setState({msg:"Sorry. Try again", resCls: "fail"});
    }
  }

  render(){

    return(
      <div>
        <canvas className="hidden" ref={(input) => {this.cv = input}}/>
        <div className="row justify-content-center"><div className={this.state.resCls} >{this.state.msg}</div></div>
        <div className="col-md-10">
          <div onDragOver={(e) => {e.preventDefault()}} className="row"><Panel st={this.state} dropHandle={this.drop} /></div>
          <div className="puzzle_set row col-md-12">
            {this.state.seq.map((block,index) => (
              this.state.answer.includes(block) ? null : <img key={index}  className="img-set" src={this.state.piece[block]} alt="" draggable="true" onDragStart={()=>this.drag(block)} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

class Panel extends Component{

  render(){

    return(
      <table cellPadding="0" onDragOver={(e) => {e.preventDefault()}}>
        <tbody>
          {Array.apply(null,{length:this.props.st.rows}).map((_,i) => (
              <tr onDragOver={(e) => {e.preventDefault()}} key={i}>{Array.apply(null,{length:this.props.st.cols}).map((_,j) => (
                  <td width={this.props.st.ws} height={this.props.st.hs} key={j} ><canvas width={this.props.st.ws} height={this.props.st.hs} ref={(input) => {this.cell = input}} onDragOver={(e) => {e.preventDefault()}} onDrop={(e) => {this.props.dropHandle(e,(i*this.props.st.cols + j))}}/></td>
                ))}</tr>
            ))}
        </tbody>
      </table>
      );
  }
}

export default App;
