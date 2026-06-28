import { useRef, useState, type ReactNode } from "react";
import { Avatar, Box, CircularProgress, IconButton, Tooltip, type SxProps, type Theme } from "@mui/material";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";

import { api, getApiErrorMessage } from "../lib/api";
import { endpoints } from "../lib/endpoints";
import { useToast } from "./Toast";
import { cropImageToSquare } from "../utils/imageCrop";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Reject oversized source files before processing; the upload itself is the small
// square crop produced below.
const MAX_INPUT_BYTES = 5 * 1024 * 1024;

interface ProfileAvatarUploaderProps {
    avatarUrl?: string | null;
    fallback?: ReactNode;
    size?: number;
    /** Called after a successful upload so the caller can refresh the profile. */
    onUploaded?: () => void | Promise<void>;
    sx?: SxProps<Theme>;
}

export function ProfileAvatarUploader({ avatarUrl, fallback, size = 72, onUploaded, sx }: ProfileAvatarUploaderProps) {
    const { pushToast } = useToast();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [busy, setBusy] = useState(false);

    const handleFile = async (file?: File | null) => {
        if (!file) {
            return;
        }

        if (!ACCEPTED_TYPES.includes(file.type)) {
            pushToast({ type: "error", title: "Unsupported image", message: "Use a JPG, PNG, or WebP image." });
            return;
        }

        if (file.size > MAX_INPUT_BYTES) {
            pushToast({ type: "error", title: "Image too large", message: "Choose an image of 5MB or less." });
            return;
        }

        setBusy(true);
        try {
            const square = await cropImageToSquare(file, { size: 512, mimeType: "image/jpeg", quality: 0.9 });
            const formData = new FormData();
            formData.append("avatar", square, "avatar.jpg");
            await api.post(endpoints.users.avatar(), formData);
            pushToast({ type: "success", title: "Profile picture updated", message: "Your new photo has been saved." });
            await onUploaded?.();
        } catch (error) {
            pushToast({ type: "error", title: "Upload failed", message: getApiErrorMessage(error) });
        } finally {
            setBusy(false);
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    return (
        <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0, ...sx }}>
            <Avatar src={avatarUrl || undefined} sx={{ width: size, height: size, fontWeight: 800 }}>
                {fallback}
            </Avatar>
            <Tooltip title="Change profile picture">
                <span>
                    <IconButton
                        size="small"
                        onClick={() => inputRef.current?.click()}
                        disabled={busy}
                        aria-label="Change profile picture"
                        sx={{
                            position: "absolute",
                            right: -6,
                            bottom: -6,
                            width: 28,
                            height: 28,
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            boxShadow: 1,
                            "&:hover": { bgcolor: "background.paper" }
                        }}
                    >
                        {busy ? <CircularProgress size={14} /> : <PhotoCameraRoundedIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                </span>
            </Tooltip>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => void handleFile(event.target.files?.[0])}
            />
        </Box>
    );
}
