<?php

class OpenAIException extends Exception
{
    public static function transcriptionFailed(string $reason): self
    {
        return new self("Transcription failed: {$reason}");
    }
}
