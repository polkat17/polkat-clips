// Remotion CLI config — see https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Default (30s - 2s buffer) was hit by font loading under CI resource
// contention with concurrent render workers. More headroom for delayRender
// calls (fonts, videos) across the board.
Config.setDelayRenderTimeoutInMilliseconds(60000);
