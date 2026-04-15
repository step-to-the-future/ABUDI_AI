import { useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";


export function Calculator({ onClose }) {
  const calcRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [position, setPosition] = useState({ x: 30, y: 200 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!window.Desmos || !calcRef.current) return;

    const calculator = window.Desmos.GraphingCalculator(calcRef.current);
    
    
    return () => {
      calculator.destroy();
    };

  }, []);

  const handleMouseDown = (e) => {
    if (window.innerWidth <= 900) return;

    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return;

      const calcWidth = 450;
      const calcHeight = 600;

      const maxX = window.innerWidth - calcWidth;
      const maxY = window.innerHeight - calcHeight;

      const newX = Math.max(0, Math.min(e.clientX - offset.x, maxX));
      const newY = Math.max(0, Math.min(e.clientY - offset.y, maxY));

      setPosition({
        x: e.clientX - newX,
        y: e.clientY - newY,
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
      style={
        isMobile
        ? {}
        : {
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