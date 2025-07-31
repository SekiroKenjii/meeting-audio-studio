<?php

namespace App\Events;

use App\Models\AudioFile;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AudioFileStatusUpdated implements ShouldBroadcast
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public $audioFile;
    public $status;
    public $processingProgress;
    public $error;

    /**
     * Create a new event instance.
     */
    public function __construct(AudioFile $audioFile, string $status, int $processingProgress = 0, string $error = null)
    {
        $this->audioFile = $audioFile;
        $this->status = $status;
        $this->processingProgress = $processingProgress;
        $this->error = $error;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('audio-files'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'audio.status.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->audioFile->id,
            'filename' => $this->audioFile->original_filename,
            'status' => $this->status,
            'processing_progress' => $this->processingProgress,
            'error' => $this->error,
            'duration' => $this->audioFile->duration ? (float) $this->audioFile->duration : null,
            'file_size' => $this->audioFile->file_size ? (int) $this->audioFile->file_size : null,
            'mime_type' => $this->audioFile->mime_type,
            'has_transcript' => $this->audioFile->transcript !== null,
            'created_at' => $this->audioFile->created_at,
            'updated_at' => $this->audioFile->updated_at,
        ];
    }
}
