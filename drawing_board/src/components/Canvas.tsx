import { useCallback, useEffect, useRef, useState } from 'react';
import axios from "axios";

interface CanvasProps {
    width: number;
    height: number;
    canvas_color: string;
}

type Coordinate = {
    x: number;
    y: number;
};

type Stroke = Coordinate[];

const Canvas = ({ width, height , canvas_color}: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPainting, setIsPainting] = useState(false);
    const [mousePosition, setMousePosition] = useState<Coordinate | undefined>(undefined);
    const [strokes, setStrokes] = useState<Stroke[]>([]);

    const startPaint = useCallback((event: MouseEvent) => {
        const coordinates = getCoordinates(event);
        if (coordinates) {
            setMousePosition(coordinates);
            setIsPainting(true);
            setStrokes((prevStrokes) => [...prevStrokes, []]);
        }
    }, []);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        canvas.addEventListener('mousedown', startPaint);
        return () => {
            canvas.removeEventListener('mousedown', startPaint);
        };
    }, [startPaint]);

    const paint = useCallback(
        (event: MouseEvent) => {
            if (isPainting) {
                const newMousePosition = getCoordinates(event);
                if (mousePosition && newMousePosition) {
                    drawLine(mousePosition, newMousePosition);
                    setMousePosition(newMousePosition);
                    setStrokes((prevStrokes) => {
                        const currentStroke = prevStrokes[prevStrokes.length - 1];
                        const updatedStroke = [...currentStroke, newMousePosition];
                        const updatedStrokes = prevStrokes.slice(0, prevStrokes.length - 1);
                        return [...updatedStrokes, updatedStroke];
                    });
                }
            }
        },
        [isPainting, mousePosition]
    );

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        canvas.addEventListener('mousemove', paint);
        return () => {
            canvas.removeEventListener('mousemove', paint);
        };
    }, [paint]);

    const exitPaint = useCallback(() => {
        setIsPainting(false);
        setMousePosition(undefined);
    }, []);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        canvas.addEventListener('mouseup', exitPaint);
        canvas.addEventListener('mouseleave', exitPaint);
        return () => {
            canvas.removeEventListener('mouseup', exitPaint);
            canvas.removeEventListener('mouseleave', exitPaint);
        };
    }, [exitPaint]);

    const getCoordinates = (event: MouseEvent): Coordinate | undefined => {
        if (!canvasRef.current) {
            return;
        }

        const canvas: HTMLCanvasElement = canvasRef.current;
        return { x: event.pageX - canvas.offsetLeft, y: event.pageY - canvas.offsetTop };
    };

    const drawLine = (originalMousePosition: Coordinate, newMousePosition: Coordinate) => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            context.strokeStyle = 'red';
            context.lineJoin = 'round';
            context.lineWidth = 5;

            context.beginPath();
            context.moveTo(originalMousePosition.x, originalMousePosition.y);
            context.lineTo(newMousePosition.x, newMousePosition.y);
            context.closePath();

            context.stroke();
        }
    };

    const clearCanvas = () => {
        if (!canvasRef.current) {
            return;
        }
        const canvas: HTMLCanvasElement = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        setStrokes([])
    };

    const sendStrokesToBackend = async () => {
        console.log(strokes)
        try {
            const response = await axios.post('http://172.25.97.82:5000/send_strokes', strokes);

            console.log(response.data);
        } catch (error) {
            console.error('Error sending strokes to the backend:', error);
        }
    };


    return(
        <>
            <button type="button" className="btn btn-info" onClick={sendStrokesToBackend}>Get Shape</button>
            <button type="button" className="btn btn-warning" onClick={clearCanvas}>Clear Canvas</button>
            <canvas ref={canvasRef} height={height} width={width} style={{backgroundColor: canvas_color}}/>;
        </>
    )
};

Canvas.defaultProps = {
    width: window.innerWidth,
    height: window.innerHeight-100,
    canvas_color: "#faf3e1"
};




export default Canvas;
