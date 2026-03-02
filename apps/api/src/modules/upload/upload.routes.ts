import { Router } from 'express';
import * as cloudinaryService from '../../common/services/cloudinary.service';

const router = Router();

// GET /api/upload/signature
router.get('/signature', (req, res) => {
  try {
    const signatureData = cloudinaryService.getUploadSignature();
    res.json({ success: true, data: signatureData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
