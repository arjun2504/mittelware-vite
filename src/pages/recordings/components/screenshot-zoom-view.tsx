import { useEffect, useRef, useState } from "react";
import { Box, Group, Slider, Text } from "@mantine/core";
import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface ScreenshotZoomViewProps {
  screenshot: string;
  alt: string;
  point?: { x: number; y: number };
  zoom?: number;
  editable?: boolean;
  onZoomChange?: (zoom: number) => void;
}

const DEFAULT_ZOOM = 2;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

const ScreenshotZoomView = (props: ScreenshotZoomViewProps) => {
  const { screenshot, alt, point, zoom, editable, onZoomChange } = props;
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  const activeZoom = zoom ?? DEFAULT_ZOOM;

  useEffect(() => {
    if (!transformRef.current) return;
    transformRef.current.setTransform(0, 0, activeZoom, 200, 'easeOutQuad');
  }, [activeZoom]);

  if (!point) {
    return (
      <Box
        style={{
          display: 'block',
          width: '100%',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-default-border)',
          overflow: 'hidden',
        }}
      >
        <img
          src={screenshot}
          alt={alt}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-default-border)',
          aspectRatio: String(aspectRatio ?? 16 / 9),
          touchAction: 'none',
        }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={activeZoom}
          minScale={MIN_ZOOM}
          maxScale={MAX_ZOOM}
          centerOnInit={false}
          pinch={{ disabled: false }}
          doubleClick={{ disabled: true }}
          wheel={{ disabled: true, wheelDisabled: true }}
          onInit={(ref: ReactZoomPanPinchRef) => {
            transformRef.current = ref;
          }}
          initialPositionX={0}
          initialPositionY={0}
          centerZoomedOut={false}
          limitToBounds={false}
        >
          <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
            <img
              src={screenshot}
              alt={alt}
              onLoad={(event) => {
                const img = event.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  setAspectRatio(img.naturalWidth / img.naturalHeight);
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                cursor: 'grab',
              }}
            />
          </TransformComponent>
        </TransformWrapper>
      </Box>
      {editable ? (
        <Group gap="sm" mt="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" w={36}>Zoom</Text>
          <Slider
            flex={1}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.1}
            value={activeZoom}
            onChange={onZoomChange}
            label={(value) => `${value.toFixed(1)}x`}
          />
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            Drag to pan
          </Text>
        </Group>
      ) : null}
    </Box>
  );
};

export default ScreenshotZoomView;
