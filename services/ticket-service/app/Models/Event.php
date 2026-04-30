<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Event extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'description', 'location',
        'event_date', 'status', 'banner_url', 'created_by',
    ];

    protected $casts = [
        'event_date' => 'datetime',
    ];

    public function ticketCategories()
    {
        return $this->hasMany(TicketCategory::class);
    }
}