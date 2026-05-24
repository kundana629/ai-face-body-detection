import cv2
import numpy as np

def draw_bounding_boxes(img, faces, bodies, show_confidence=True):
    """
    Overlays stylized cyber bounding boxes with corners and score text labels on the image.
    Faces: Cyan RGB(6, 182, 212)
    Bodies/Persons: Magenta RGB(217, 70, 239)
    """
    out_img = img.copy()
    
    # 1. Draw body/person boxes - Magenta
    for idx, body in enumerate(bodies):
        ax, ay, aw, ah = body["absolute_box"]
        score = body["score"]
        color = (239, 70, 217)  # BGR for Magenta
        
        # Bounding box border
        cv2.rectangle(out_img, (ax, ay), (ax + aw, ay + ah), color, 2)
        
        # Stylized thicker corners (reticles)
        cl = max(10, int(min(aw, ah) * 0.15))
        # Top-left
        cv2.line(out_img, (ax, ay), (ax + cl, ay), color, 4)
        cv2.line(out_img, (ax, ay), (ax, ay + cl), color, 4)
        # Top-right
        cv2.line(out_img, (ax + aw, ay), (ax + aw - cl, ay), color, 4)
        cv2.line(out_img, (ax + aw, ay), (ax, ay + cl), color, 4)
        # Bottom-left
        cv2.line(out_img, (ax, ay + ah), (ax + cl, ay + ah), color, 4)
        cv2.line(out_img, (ax, ay + ah), (ax, ay + ah - cl), color, 4)
        # Bottom-right
        cv2.line(out_img, (ax + aw, ay + ah), (ax + aw - cl, ay + ah), color, 4)
        cv2.line(out_img, (ax + aw, ay + ah), (ax + aw, ay + ah - cl), color, 4)
        
        # Label block
        label = f"Person #{idx + 1}"
        if show_confidence:
            label += f" {int(score * 100)}%"
            
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.4
        thickness = 1
        (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        # Label backdrop
        cv2.rectangle(out_img, (ax, ay - text_h - 8), (ax + text_w + 10, ay), color, -1)
        # Dark slate text for high contrast on filled color
        cv2.putText(out_img, label, (ax + 5, ay - 4), font, font_scale, (15, 23, 42), thickness, cv2.LINE_AA)

    # 2. Draw face boxes - Cyan
    for idx, face in enumerate(faces):
        ax, ay, aw, ah = face["absolute_box"]
        score = face["score"]
        color = (212, 182, 6)  # BGR for Cyan
        
        # Bounding box border
        cv2.rectangle(out_img, (ax, ay), (ax + aw, ay + ah), color, 2)
        
        # Stylized corners
        cl = max(8, int(min(aw, ah) * 0.15))
        # Top-left
        cv2.line(out_img, (ax, ay), (ax + cl, ay), color, 4)
        cv2.line(out_img, (ax, ay), (ax, ay + cl), color, 4)
        # Top-right
        cv2.line(out_img, (ax + aw, ay), (ax + aw - cl, ay), color, 4)
        cv2.line(out_img, (ax + aw, ay), (ax + aw, ay + cl), color, 4)
        # Bottom-left
        cv2.line(out_img, (ax, ay + ah), (ax + cl, ay + ah), color, 4)
        cv2.line(out_img, (ax, ay + ah), (ax, ay + ah - cl), color, 4)
        # Bottom-right
        cv2.line(out_img, (ax + aw, ay + ah), (ax + aw - cl, ay + ah), color, 4)
        cv2.line(out_img, (ax + aw, ay + ah), (ax + aw, ay + ah - cl), color, 4)
        
        label = f"Face #{idx + 1}"
        if show_confidence:
            label += f" {int(score * 100)}%"
            
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.4
        thickness = 1
        (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
        
        cv2.rectangle(out_img, (ax, ay - text_h - 8), (ax + text_w + 10, ay), color, -1)
        cv2.putText(out_img, label, (ax + 5, ay - 4), font, font_scale, (15, 23, 42), thickness, cv2.LINE_AA)
        
    return out_img


def crop_subject(img, relative_box, padding=0.5, zoom=1.0, shift_x=0.0, shift_y=0.0, blur_background=True, blur_strength=20, target_ratio=1.0):
    """
    Intelligently crops an image around a relative bounding box, keeping aspect ratio.
    If the crop overflows the image bounds, blur expansion is applied.
    """
    h, w = img.shape[:2]
    rx, ry, rw, rh = relative_box
    
    # Absolute pixel box
    box_x = rx * w
    box_y = ry * h
    box_w = rw * w
    box_h = rh * h
    
    # Calculate crop center
    center_x = box_x + box_w / 2.0
    center_y = box_y + box_h / 2.0
    
    # Apply user-defined offsets
    center_x += shift_x * w
    center_y += shift_y * h
    
    # Add padding spacing around subject
    pad_w = box_w * padding
    pad_h = box_h * padding
    
    target_w = max(40, box_w + pad_w * 2)
    target_h = max(40, box_h + pad_h * 2)
    
    # Scale width or height to preserve target ratio
    if target_w / target_h > target_ratio:
        # Fit height based on width
        crop_h = target_w / target_ratio
        crop_w = target_w
    else:
        # Fit width based on height
        crop_w = target_h * target_ratio
        crop_h = target_h
        
    # Scale by manual zoom (higher zoom -> smaller crop boundaries)
    crop_w /= zoom
    crop_h /= zoom
    
    left = int(center_x - crop_w / 2.0)
    top = int(center_y - crop_h / 2.0)
    crop_w = int(crop_w)
    crop_h = int(crop_h)
    
    # Check for out-of-bounds frame expansion
    is_out_of_bounds = left < 0 or top < 0 or (left + crop_w) > w or (top + crop_h) > h
    
    if not blur_background or not is_out_of_bounds:
        # Standard clamp-to-boundary crop
        crop_w = min(w, crop_w)
        crop_h = min(h, crop_h)
        
        clamped_ratio = crop_w / crop_h
        if abs(clamped_ratio - target_ratio) > 0.01:
            if clamped_ratio > target_ratio:
                crop_w = int(crop_h * target_ratio)
            else:
                crop_h = int(crop_w / target_ratio)
                
        left = max(0, min(w - crop_w, left))
        top = max(0, min(h - crop_h, top))
        
        return img[top:top+crop_h, left:left+crop_w]
    else:
        # High-end smart blur expand
        bg_w, bg_h = crop_w, crop_h
        
        # Fast blur background by resizing and blurring the whole frame
        bg = cv2.resize(img, (bg_w, bg_h))
        ksize = int(blur_strength * 2) | 1  # ensure odd size kernel
        blurred_bg = cv2.GaussianBlur(bg, (ksize, ksize), 0)
        
        # Intersect valid coordinates within original image
        valid_left = max(0, left)
        valid_top = max(0, top)
        valid_right = min(w, left + crop_w)
        valid_bottom = min(h, top + crop_h)
        
        valid_w = valid_right - valid_left
        valid_h = valid_bottom - valid_top
        
        if valid_w > 0 and valid_h > 0:
            real_content = img[valid_top:valid_bottom, valid_left:valid_right]
            
            # Place real content inside the expanded blurred backdrop
            comp_x = valid_left - left
            comp_y = valid_top - top
            blurred_bg[comp_y:comp_y+valid_h, comp_x:comp_x+valid_w] = real_content
            
        return blurred_bg


def resize_image(img, mode="custom", target_w=512, target_h=512, preserve_aspect=True):
    """
    Resizes an image according to specified parameters.
    """
    h, w = img.shape[:2]
    
    if mode == "fixed":
        return cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)
        
    elif preserve_aspect:
        aspect = float(w) / float(h)
        if target_w / target_h > aspect:
            # Width constraint is looser, scale based on height
            new_h = target_h
            new_w = int(target_h * aspect)
        else:
            # Height constraint is looser, scale based on width
            new_w = target_w
            new_h = int(target_w / aspect)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
    else:
        # Custom size
        return cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)
