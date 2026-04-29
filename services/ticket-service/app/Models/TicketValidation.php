<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TicketValidation extends Model
{
    use HasUuids;

    protected $fillable = ['ticket_id', 'validated_by', 'result', 'gate'];

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}