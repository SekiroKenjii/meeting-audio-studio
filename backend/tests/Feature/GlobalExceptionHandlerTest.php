<?php

namespace Tests\Feature;

use App\Constants\Messages;
use App\Constants\ResponseCodes;
use App\Exceptions\AudioProcessingException;
use Tests\TestCase;

class GlobalExceptionHandlerTest extends TestCase
{
    private const string NONEXISTENT_ENDPOINT = '/api/nonexistent-endpoint';

    public function test_it_handles_not_found_exceptions_for_api_routes()
    {
        $response = $this->getJson(self::NONEXISTENT_ENDPOINT);

        $response->assertStatus(ResponseCodes::NOT_FOUND)
            ->assertJson([
                'success' => false,
                'message' => Messages::ENDPOINT_NOT_FOUND
            ]);
    }

    public function test_it_handles_method_not_allowed_exceptions()
    {
        $response = $this->putJson('/api/v1/audio-files');

        $response->assertStatus(ResponseCodes::METHOD_NOT_ALLOWED)
            ->assertJson([
                'success' => false,
                'message' => Messages::METHOD_NOT_ALLOWED
            ]);
    }

    public function test_it_includes_debug_information_in_debug_mode()
    {
        config(['app.debug' => true]);

        $response = $this->getJson(self::NONEXISTENT_ENDPOINT);

        $response->assertStatus(ResponseCodes::NOT_FOUND)
            ->assertJsonStructure([
                'success',
                'message',
                'debug' => [
                    'exception',
                    'file',
                    'line',
                    'trace'
                ],
                'request' => [
                    'method',
                    'url',
                    'headers',
                    'params'
                ]
            ]);
    }

    public function test_it_excludes_debug_information_in_production_mode()
    {
        config(['app.debug' => false]);

        $response = $this->getJson(self::NONEXISTENT_ENDPOINT);

        $response->assertStatus(ResponseCodes::NOT_FOUND)
            ->assertJson([
                'success' => false,
                'message' => Messages::ENDPOINT_NOT_FOUND
            ])
            ->assertJsonMissing(['debug', 'request']);
    }

    public function test_audio_processing_exception_has_correct_message()
    {
        $exception = AudioProcessingException::fileNotFound('/test/path.mp3');
        $this->assertEquals('Audio file not found at path: /test/path.mp3', $exception->getMessage());
    }
}
