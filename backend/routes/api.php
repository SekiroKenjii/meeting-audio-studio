<?php

use App\Http\Controllers\Api\V1\AudioController as V1AudioController;
use App\Http\Controllers\Api\V1\TranscriptController as V1TranscriptController;
use App\Http\Controllers\Api\DocsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/user', fn (Request $request)
    => $request->user())->middleware('auth:sanctum');

// API v1 routes
Route::prefix('v1')->name('v1.')->group(function () {
    // Audio files resource routes with custom endpoints
    Route::prefix('audio-files')->name('audio-files.')->group(function () {
        Route::get('/', [V1AudioController::class, 'index'])->name('index');
        Route::post('/', [V1AudioController::class, 'store'])->name('store');
        Route::get('/config', [V1AudioController::class, 'config'])->name('config');
        Route::get('/backups', [V1AudioController::class, 'backups'])->name('backups');
        Route::get('/backups/{filename}/download', [V1AudioController::class, 'downloadBackup'])->name('backups.download');
        Route::get('/backups/{filename}/stream', [V1AudioController::class, 'streamBackup'])->name('backups.stream');

        // Chunked upload routes
        Route::prefix('chunked')->name('chunked.')->group(function () {
            Route::post('/initialize', [V1AudioController::class, 'initializeChunkedUpload'])->name('initialize');
            Route::post('/upload', [V1AudioController::class, 'uploadChunk'])->name('upload');
            Route::post('/finalize/{uploadId}', [V1AudioController::class, 'finalizeChunkedUpload'])->name('finalize');
            Route::delete('/cancel/{uploadId}', [V1AudioController::class, 'cancelChunkedUpload'])->name('cancel');
            Route::get('/status/{uploadId}', [V1AudioController::class, 'getChunkedUploadStatus'])->name('status');
        });

        Route::get('/{id}', [V1AudioController::class, 'show'])->name('show');
        Route::get('/{id}/download', [V1AudioController::class, 'download'])->name('download');
        Route::get('/{id}/stream', [V1AudioController::class, 'stream'])->name('stream');
        Route::get('/{id}/transcript', [V1AudioController::class, 'transcript'])->name('transcript');
    });

    // Transcript resource routes
    Route::prefix('transcripts')->name('transcripts.')->group(function () {
        Route::get('/{id}', [V1TranscriptController::class, 'show'])->name('show');
        Route::post('/{id}/queries', [V1TranscriptController::class, 'query'])->name('queries.store');
    });
});

// API Documentation route
Route::get('/docs', [DocsController::class, 'index'])->name('docs');

// Health check route
Route::get('/health', [DocsController::class, 'health'])->name('health');
