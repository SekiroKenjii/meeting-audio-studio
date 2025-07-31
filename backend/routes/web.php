<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Horizon dashboard will be automatically registered at /horizon
// You can access it at http://localhost:8000/horizon in development
