import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";


export function Calculator({ onClose }) {
  const calcRef = useRef(null);

  const [position, setPosition] = useState({ x: 75, y: 200 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.Desmos || !calcRef.current) return;

    const calculator = window.Desmos.GraphingCalculator(calcRef.current);
    
    
    return () => {
      calculator.destroy();
    };

  }, []);

  const handleMouseDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;

      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, offset]);

  return (
    <>
    <div
      className="calculator"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      
      <div onMouseDown={handleMouseDown} className="calc_cont">
        
        <p className="sigp">Calculator</p>
        <button onMouseDown={(e) => e.stopPropagation()} onClick={onClose} className="close_but"><IoMdClose className="close_pic"/></button>
      
      </div>
      

      <div
        ref={calcRef}
        className="calc_body"
      />

    </div>
    </>
  );
}