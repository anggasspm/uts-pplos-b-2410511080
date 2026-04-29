<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TicketCategory extends Model
{
    use HasUuids;

    protected $fillable = [
        'event_id', 'name', 'description', 'price', 'quota', 'sold',
    ];

    protected $casts = [
        'price' => 'float',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function availableQuota(): int
    {
        return $this->quota - $this->sold;
    }
}